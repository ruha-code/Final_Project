import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Один таймслот, выставленный доктором: дата, время начала, длительность.
///
/// Слот живёт в коллекции `availability_slots/{auto-id}`. После бронирования
/// помечается как booked и хранит ссылку на patient + appointmentId.
@immutable
class AvailabilitySlot {
  final String id;
  final String doctorUid;
  final String doctorName;
  final DateTime startsAt;
  final int durationMinutes;
  final bool isBooked;
  final String? bookedByUid;
  final String? bookedByName;
  final String? appointmentId;

  const AvailabilitySlot({
    required this.id,
    required this.doctorUid,
    required this.doctorName,
    required this.startsAt,
    required this.durationMinutes,
    required this.isBooked,
    this.bookedByUid,
    this.bookedByName,
    this.appointmentId,
  });

  DateTime get endsAt =>
      startsAt.add(Duration(minutes: durationMinutes));

  factory AvailabilitySlot.fromDoc(
      DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? const <String, dynamic>{};
    return AvailabilitySlot(
      id: doc.id,
      doctorUid: (d['doctorUid'] as String?) ?? '',
      doctorName: (d['doctorName'] as String?) ?? '',
      startsAt: (d['startsAt'] as Timestamp?)?.toDate() ?? DateTime(1970),
      durationMinutes: (d['durationMinutes'] as num?)?.toInt() ?? 30,
      isBooked: (d['isBooked'] as bool?) ?? false,
      bookedByUid: d['bookedByUid'] as String?,
      bookedByName: d['bookedByName'] as String?,
      appointmentId: d['appointmentId'] as String?,
    );
  }

  Map<String, Object?> toCreate() => {
        'doctorUid': doctorUid,
        'doctorName': doctorName,
        'startsAt': Timestamp.fromDate(startsAt),
        'durationMinutes': durationMinutes,
        'isBooked': false,
        'bookedByUid': null,
        'bookedByName': null,
        'appointmentId': null,
        'createdAt': FieldValue.serverTimestamp(),
      };
}
