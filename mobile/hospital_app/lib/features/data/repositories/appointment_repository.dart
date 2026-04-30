import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hospital_app/features/data/models/appointment.dart';
import 'package:hospital_app/features/data/models/availability_slot.dart';

/// Репозиторий для расписания и записей. Держит вместе две коллекции:
///   availability_slots/{auto-id}  — что доктор сам выставил как свободное
///   appointments/{auto-id}         — фактические брони
///
/// Бронирование/отмена — это всегда атомарная операция на двух коллекциях,
/// поэтому пишутся через WriteBatch.
class AppointmentRepository {
  AppointmentRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  CollectionReference<Map<String, dynamic>> get _slots =>
      _db.collection('availability_slots');
  CollectionReference<Map<String, dynamic>> get _appts =>
      _db.collection('appointments');

  // ── Слоты ──

  /// Все слоты конкретного доктора, начиная с now (прошлые отбрасываем).
  /// Сортировка по времени. Включает и свободные, и забронированные —
  /// UI сам разделит их по статусу.
  Stream<List<AvailabilitySlot>> watchSlotsForDoctor(String doctorUid) {
    final cutoff = Timestamp.fromDate(
        DateTime.now().subtract(const Duration(hours: 1)));
    return _slots
        .where('doctorUid', isEqualTo: doctorUid)
        .where('startsAt', isGreaterThanOrEqualTo: cutoff)
        .orderBy('startsAt')
        .snapshots()
        .map((s) => s.docs.map(AvailabilitySlot.fromDoc).toList());
  }

  /// Только свободные слоты доктора в будущем — для пациента.
  Stream<List<AvailabilitySlot>> watchAvailableSlots(String doctorUid) {
    final cutoff = Timestamp.fromDate(DateTime.now());
    return _slots
        .where('doctorUid', isEqualTo: doctorUid)
        .where('isBooked', isEqualTo: false)
        .where('startsAt', isGreaterThanOrEqualTo: cutoff)
        .orderBy('startsAt')
        .snapshots()
        .map((s) => s.docs.map(AvailabilitySlot.fromDoc).toList());
  }

  Future<void> addSlot(AvailabilitySlot slot) async {
    await _slots.add(slot.toCreate());
  }

  /// Удалить слот может только доктор-владелец, и только если он не забронирован.
  Future<void> deleteSlot(String slotId) async {
    await _slots.doc(slotId).delete();
  }

  // ── Записи ──

  /// Все записи доктора (любой статус, новые сначала).
  Stream<List<Appointment>> watchAppointmentsForDoctor(String doctorUid) {
    return _appts
        .where('doctorUid', isEqualTo: doctorUid)
        .orderBy('startsAt', descending: true)
        .snapshots()
        .map((s) => s.docs.map(Appointment.fromDoc).toList());
  }

  /// Все записи пациента.
  Stream<List<Appointment>> watchAppointmentsForPatient(String patientUid) {
    return _appts
        .where('patientUid', isEqualTo: patientUid)
        .orderBy('startsAt', descending: true)
        .snapshots()
        .map((s) => s.docs.map(Appointment.fromDoc).toList());
  }

  /// Сегодняшние записи доктора (для дашборда).
  Stream<List<Appointment>> watchTodaysAppointmentsForDoctor(
      String doctorUid) {
    final now = DateTime.now();
    final dayStart = DateTime(now.year, now.month, now.day);
    final dayEnd = dayStart.add(const Duration(days: 1));
    return _appts
        .where('doctorUid', isEqualTo: doctorUid)
        .where('startsAt',
            isGreaterThanOrEqualTo: Timestamp.fromDate(dayStart),
            isLessThan: Timestamp.fromDate(dayEnd))
        .orderBy('startsAt')
        .snapshots()
        .map((s) => s.docs.map(Appointment.fromDoc).toList());
  }

  // ── Действия ──

  /// Пациент бронирует слот. Атомарно: помечает слот booked + создаёт appointment.
  /// Если слот уже забронирован — выбросит исключение.
  Future<void> bookSlot({
    required AvailabilitySlot slot,
    required String patientUid,
    required String patientName,
    required String reason,
  }) async {
    if (slot.isBooked) {
      throw StateError('Slot is already booked');
    }
    final apptRef = _appts.doc();
    final slotRef = _slots.doc(slot.id);

    final appt = Appointment(
      id: apptRef.id,
      slotId: slot.id,
      doctorUid: slot.doctorUid,
      doctorName: slot.doctorName,
      patientUid: patientUid,
      patientName: patientName,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      status: AppointmentStatus.pending,
      reason: reason,
    );

    final batch = _db.batch();
    batch.set(apptRef, appt.toCreate());
    batch.update(slotRef, {
      'isBooked': true,
      'bookedByUid': patientUid,
      'bookedByName': patientName,
      'appointmentId': apptRef.id,
    });
    await batch.commit();
  }

  /// Поменять статус записи (confirm / complete).
  Future<void> updateStatus(String appointmentId,
      AppointmentStatus newStatus) async {
    await _appts.doc(appointmentId).update({'status': newStatus.asString});
  }

  /// Отмена записи. Меняем статус appointment + освобождаем слот, чтобы
  /// в нём кто-то ещё мог записаться.
  Future<void> cancelAppointment(Appointment appt) async {
    final batch = _db.batch();
    batch.update(_appts.doc(appt.id),
        {'status': AppointmentStatus.cancelled.asString});
    if (appt.slotId.isNotEmpty) {
      batch.update(_slots.doc(appt.slotId), {
        'isBooked': false,
        'bookedByUid': null,
        'bookedByName': null,
        'appointmentId': null,
      });
    }
    await batch.commit();
  }
}
