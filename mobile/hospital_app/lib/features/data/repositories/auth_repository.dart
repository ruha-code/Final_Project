import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';

/// Auth + регистрация с ролью + чтение профиля.
///
/// При signUp создаются три документа:
///   users/{uid}              — профиль с ролью
///   doctors/{uid}            — если role=doctor (минимальная карточка)
///   patients/{uid}           — если role=patient (минимальная карточка)
///
/// Ключ привязки — uid (он же id документа). Никаких отдельных полей-связок.
class AuthRepository {
  AuthRepository({FirebaseAuth? firebaseAuth, FirebaseFirestore? firestore})
      : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;

  /// userChanges чтобы профиль (displayName) обновлялся без ручного refresh.
  Stream<User?> get user => _firebaseAuth.userChanges();

  User? get currentUser => _firebaseAuth.currentUser;

  /// Стрим профиля юзера из Firestore.
  ///
  /// Игнорируем "пустые" события из локального кеша: при свежей регистрации
  /// snapshots() сначала эмитит null (кеш пустой), и лишь спустя секунду
  /// прилетает реальный документ с сервера. Если бы мы пропустили этот
  /// первый null в Bloc, интерфейс на мгновение показывал бы "Profile not
  /// found". Поэтому фильтруем: null отдаём только если документ
  /// гарантированно пришёл с сервера и его всё равно нет.
  Stream<UserProfile?> watchUserProfile(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .snapshots(includeMetadataChanges: true)
        .where((doc) => !doc.metadata.isFromCache || doc.exists)
        .map((doc) => doc.exists ? UserProfile.fromDoc(doc) : null);
  }

  /// Стрим всех юзеров с указанной ролью — нужен для экрана "новый чат".
  /// Возвращает [UserProfile], отсортированных по displayName.
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

  /// Стрим всех юзеров (любая роль). Доктор использует его, чтобы видеть
  /// и докторов, и пациентов.
  Stream<List<UserProfile>> watchAllUsers() {
    return _firestore.collection('users').snapshots().map((snap) {
      final list = snap.docs.map(UserProfile.fromDoc).toList()
        ..sort((a, b) => a.displayName
            .toLowerCase()
            .compareTo(b.displayName.toLowerCase()));
      return list;
    });
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

  /// Регистрация с ролью. Создаёт Auth-юзера, пишет displayName, заводит
  /// users/{uid} + doctors/{uid} или patients/{uid} (минимальная заготовка
  /// карточки — пользователь дополняет её позже из своего профиля).
  ///
  /// Если запись в Firestore упадёт после успешного создания Auth-юзера,
  /// удаляем созданный Auth-аккаунт, чтобы не остался "осиротевший" логин
  /// без роли.
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
      // Записываем три документа одной транзакцией: профиль с ролью,
      // плюс пустую карточку в соответствующей коллекции.
      final batch = _firestore.batch();
      final profile = UserProfile(
        uid: user.uid,
        role: role,
        displayName: displayName.trim(),
        email: email.trim(),
      );
      batch.set(
        _firestore.collection('users').doc(user.uid),
        profile.toMap(),
      );

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
        batch.set(
          _firestore.collection('doctors').doc(user.uid),
          blank.toCreate(),
        );
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
        batch.set(
          _firestore.collection('patients').doc(user.uid),
          blank.toCreate(),
        );
      }

      await batch.commit();
      await user.reload();
    } catch (e) {
      // Откат: чтобы не остался Auth-юзер без записей в Firestore.
      try {
        await user.delete();
      } catch (_) {}
      rethrow;
    }
  }

  Future<void> signOut() => _firebaseAuth.signOut();
}
