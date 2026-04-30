import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

enum AppointmentStatus {
  pending,
  confirmed,
  cancelled,
  completed;

  static AppointmentStatus fromString(String? raw) {
    switch (raw) {
      case 'confirmed':
        return AppointmentStatus.confirmed;
      case 'cancelled':
        return AppointmentStatus.cancelled;
      case 'completed':
        return AppointmentStatus.completed;
      default:
        return AppointmentStatus.pending;
    }
  }

  String get asString => name;

  String get label {
    switch (this) {
      case AppointmentStatus.pending:
        return 'Pending';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.completed:
        return 'Completed';
    }
  }

  Color get color {
    switch (this) {
      case AppointmentStatus.pending:
        return AppColors.orange;
      case AppointmentStatus.confirmed:
        return AppColors.primary;
      case AppointmentStatus.cancelled:
        return AppColors.red;
      case AppointmentStatus.completed:
        return AppColors.textTertiary;
    }
  }
}

@immutable
class Appointment {
  final String id;
  final String slotId;
  final String doctorUid;
  final String doctorName;
  final String patientUid;
  final String patientName;
  final DateTime startsAt;
  final int durationMinutes;
  final AppointmentStatus status;
  final String reason;
  final DateTime? createdAt;

  const Appointment({
    required this.id,
    required this.slotId,
    required this.doctorUid,
    required this.doctorName,
    required this.patientUid,
    required this.patientName,
    required this.startsAt,
    required this.durationMinutes,
    required this.status,
    required this.reason,
    this.createdAt,
  });

  factory Appointment.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? const <String, dynamic>{};
    return Appointment(
      id: doc.id,
      slotId: (d['slotId'] as String?) ?? '',
      doctorUid: (d['doctorUid'] as String?) ?? '',
      doctorName: (d['doctorName'] as String?) ?? '',
      patientUid: (d['patientUid'] as String?) ?? '',
      patientName: (d['patientName'] as String?) ?? '',
      startsAt: (d['startsAt'] as Timestamp?)?.toDate() ?? DateTime(1970),
      durationMinutes: (d['durationMinutes'] as num?)?.toInt() ?? 30,
      status: AppointmentStatus.fromString(d['status'] as String?),
      reason: (d['reason'] as String?) ?? '',
      createdAt: (d['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, Object?> toCreate() => {
        'slotId': slotId,
        'doctorUid': doctorUid,
        'doctorName': doctorName,
        'patientUid': patientUid,
        'patientName': patientName,
        'startsAt': Timestamp.fromDate(startsAt),
        'durationMinutes': durationMinutes,
        'status': status.asString,
        'reason': reason,
        'createdAt': FieldValue.serverTimestamp(),
      };
}
