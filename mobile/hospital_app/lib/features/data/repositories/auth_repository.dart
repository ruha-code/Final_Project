import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';

/// Auth + регистрация + создание Firestore-документов + генерация слотов
/// для свежесозданных докторов.
///
/// Параметры расписания, чтобы потом не размазывать константы по проекту.
const int kSlotMinutes = 30;
const int kWorkdayStartHour = 9;
const int kWorkdayEndHour = 17; // последний слот стартует в 16:30
const int kSlotsForwardDays = 14;

class AuthRepository {
  AuthRepository({FirebaseAuth? firebaseAuth, FirebaseFirestore? firestore})
      : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;

  Stream<User?> get user => _firebaseAuth.userChanges();
  User? get currentUser => _firebaseAuth.currentUser;

  Stream<UserProfile?> watchUserProfile(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .snapshots(includeMetadataChanges: true)
        .where((doc) => !doc.metadata.isFromCache || doc.exists)
        .map((doc) => doc.exists ? UserProfile.fromDoc(doc) : null);
  }

  Stream<List<UserProfile>> watchUsersByRole(UserRole role) {
    return _firestore
        .collection('users')
        .where('role', isEqualTo: role.asString)
        .snapshots()
        .map((snap) {
      final list = snap.docs.map(UserProfile.fromDoc).toList()
        ..sort((a, b) => a.displayName
            .toLowerCase()
            .compareTo(b.displayName.toLowerCase()));
      return list;
    });
  }

  Stream<List<UserProfile>> watchAllUsers() {
    return _firestore.collection('users').snapshots().map((snap) {
      final list = snap.docs.map(UserProfile.fromDoc).toList()
        ..sort((a, b) => a.displayName
            .toLowerCase()
            .compareTo(b.displayName.toLowerCase()));
      return list;
    });
  }

  Future<void> sendPasswordResetEmail(String email) async {
    await _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    await _firebaseAuth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  /// Регистрация. У нас в app регистрируются только пациенты, но метод
  /// принимает role на случай, если ты заведёшь admin-инструмент.
  ///
  /// Если role==doctor — после создания доктора генерируем для него
  /// 14 дней × Mon-Fri × 9-17 шаг 30 минут слотов в `availability_slots`.
  Future<void> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
    required UserRole role,
  }) async {
    if (role != UserRole.doctor && role != UserRole.patient) {
      throw ArgumentError('Role must be doctor or patient');
    }

    final cred = await _firebaseAuth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    final user = cred.user!;
    await user.updateDisplayName(displayName.trim());

    try {
      final batch = _firestore.batch();
      final profile = UserProfile(
        uid: user.uid,
        role: role,
        displayName: displayName.trim(),
        email: email.trim(),
      );
      batch.set(_firestore.collection('users').doc(user.uid),
          profile.toMap());

      if (role == UserRole.doctor) {
        final blank = Doctor(
          id: user.uid,
          name: displayName.trim(),
          specialty: doctorSpecialties.first,
          schedule: 'Mon-Fri 09:00-17:00',
          availability: 'Available',
          phone: '',
          email: email.trim(),
          address: '',
        );
        batch.set(_firestore.collection('doctors').doc(user.uid),
            blank.toCreate());
      } else {
        final blank = Patient(
          id: user.uid,
          name: displayName.trim(),
          age: 0,
          gender: 'Other',
          diagnosis: '',
          status: 'Stable',
          ward: 'Outpatient',
          assignedDoctor: '',
          phone: '',
          email: email.trim(),
          address: '',
        );
        batch.set(_firestore.collection('patients').doc(user.uid),
            blank.toCreate());
      }

      await batch.commit();

      // После создания доктора — генерируем для него слоты на 14 дней.
      if (role == UserRole.doctor) {
        await generateSlotsForDoctor(
          doctorUid: user.uid,
          doctorName: displayName.trim(),
        );
      }

      user.sendEmailVerification().catchError((_) {});
      await user.reload();
    } catch (e) {
      try {
        await user.delete();
      } catch (_) {}
      rethrow;
    }
  }

  Future<void> signOut() => _firebaseAuth.signOut();

  Future<void> sendEmailVerification() async {
    final u = _firebaseAuth.currentUser;
    if (u == null || u.emailVerified) return;
    await u.sendEmailVerification();
  }

  Future<void> reloadUser() async {
    await _firebaseAuth.currentUser?.reload();
  }

  // ── Settings: смена email и пароля ──

  /// Сменить пароль. Firebase требует "недавнюю" авторизацию для таких
  /// операций; если её нет — выкидывает `requires-recent-login`. Поэтому
  /// сначала reauth с текущим паролем, потом updatePassword.
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final u = _firebaseAuth.currentUser;
    if (u == null || u.email == null) {
      throw StateError('Not signed in');
    }
    final cred = EmailAuthProvider.credential(
        email: u.email!, password: currentPassword);
    await u.reauthenticateWithCredential(cred);
    await u.updatePassword(newPassword);
  }

  /// Сменить email. Тоже требует reauth. После update — Firebase пошлёт
  /// верификационное письмо на новый адрес. До клика на ссылку email не
  /// сменится (Firebase современный: используется verifyBeforeUpdateEmail).
  Future<void> changeEmail({
    required String currentPassword,
    required String newEmail,
  }) async {
    final u = _firebaseAuth.currentUser;
    if (u == null || u.email == null) {
      throw StateError('Not signed in');
    }
    final cred = EmailAuthProvider.credential(
        email: u.email!, password: currentPassword);
    await u.reauthenticateWithCredential(cred);
    await u.verifyBeforeUpdateEmail(newEmail.trim());
    // Заметка: users/{uid}.email НЕ меняется здесь автоматически. После
    // того как юзер кликнет ссылку и Firebase сменит email, обновление
    // прокатится через userChanges(). Для UI этого хватает; на стороне
    // Firestore email можно тоже обновить, но это отдельный шаг.
  }

  Future<void> deleteAccount({required String currentPassword}) async {
    final u = _firebaseAuth.currentUser;
    if (u == null || u.email == null) {
      throw StateError('Not signed in');
    }
    final cred = EmailAuthProvider.credential(
        email: u.email!, password: currentPassword);
    await u.reauthenticateWithCredential(cred);

    // Чистим документы юзера. Свои appointments/слоты — оставляем как есть
    // (за их удаление отвечала бы Cloud Function). Для дипломки достаточно.
    final batch = _firestore.batch();
    batch.delete(_firestore.collection('users').doc(u.uid));
    batch.delete(_firestore.collection('patients').doc(u.uid));
    await batch.commit();

    await u.delete();
  }

  /// Параметр для toggle уведомлений в Settings. Это просто bool на профиле,
  /// без интеграции с FCM (push-нотификации — отдельная история).
  Future<void> setNotificationsEnabled(bool enabled) async {
    final u = _firebaseAuth.currentUser;
    if (u == null) return;
    await _firestore
        .collection('users')
        .doc(u.uid)
        .update({'notificationsEnabled': enabled});
  }

  // ── Слоты: генерация ──

  /// Сгенерировать слоты для доктора на 14 дней вперёд (Mon-Fri, 9-17, шаг 30).
  /// Если слот на ту же дату/время уже есть — пропускаем (идемпотентно).
  Future<int> generateSlotsForDoctor({
    required String doctorUid,
    required String doctorName,
  }) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // Сначала вытаскиваем существующие слоты в этом окне, чтобы не
    // дублировать. На 14 дней слотов максимум 14*16 = 224 — Firestore
    // ограничение в 500 на batch не страшно. Но всё-равно делаем
    // commit'ом по 400, на запас.
    final windowStart = Timestamp.fromDate(today);
    final windowEnd = Timestamp.fromDate(
        today.add(const Duration(days: kSlotsForwardDays + 1)));

    final existing = await _firestore
        .collection('availability_slots')
        .where('doctorUid', isEqualTo: doctorUid)
        .where('startsAt', isGreaterThanOrEqualTo: windowStart)
        .where('startsAt', isLessThan: windowEnd)
        .get();
    final existingTimes = existing.docs
        .map((d) => (d.data()['startsAt'] as Timestamp?)?.toDate())
        .whereType<DateTime>()
        .map((dt) => dt.millisecondsSinceEpoch)
        .toSet();

    final candidates = <DateTime>[];
    for (int dayOffset = 0; dayOffset < kSlotsForwardDays; dayOffset++) {
      final day = today.add(Duration(days: dayOffset));
      // weekday: Mon=1 .. Sun=7. Sat=6, Sun=7 — пропускаем.
      if (day.weekday >= DateTime.saturday) continue;
      for (int h = kWorkdayStartHour; h < kWorkdayEndHour; h++) {
        for (int m = 0; m < 60; m += kSlotMinutes) {
          final ts = DateTime(day.year, day.month, day.day, h, m);
          // Прошлые слоты сегодня — пропускаем (бронировать нет смысла).
          if (ts.isBefore(now)) continue;
          if (existingTimes.contains(ts.millisecondsSinceEpoch)) continue;
          candidates.add(ts);
        }
      }
    }

    int created = 0;
    var batch = _firestore.batch();
    int inBatch = 0;
    for (final ts in candidates) {
      final ref = _firestore.collection('availability_slots').doc();
      batch.set(ref, {
        'doctorUid': doctorUid,
        'doctorName': doctorName,
        'startsAt': Timestamp.fromDate(ts),
        'durationMinutes': kSlotMinutes,
        'isBooked': false,
        'bookedByUid': null,
        'bookedByName': null,
        'appointmentId': null,
        'createdAt': FieldValue.serverTimestamp(),
      });
      inBatch++;
      created++;
      if (inBatch >= 400) {
        await batch.commit();
        batch = _firestore.batch();
        inBatch = 0;
      }
    }
    if (inBatch > 0) await batch.commit();
    return created;
  }

  /// Прогнать generateSlotsForDoctor для каждого доктора, у которого ещё
  /// нет слотов в окне 14 дней. Идемпотентно — можно вызывать на старте
  /// приложения для backfill старых doctor-аккаунтов.
  Future<void> backfillSlotsForAllDoctors() async {
    final docs = await _firestore.collection('doctors').get();
    for (final doc in docs.docs) {
      final data = doc.data();
      final name = (data['name'] as String?) ?? '';
      await generateSlotsForDoctor(doctorUid: doc.id, doctorName: name);
    }
  }
}
