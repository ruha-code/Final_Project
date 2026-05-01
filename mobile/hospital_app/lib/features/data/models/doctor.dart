import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hospital_app/features/data/models/_avatar_style.dart';

/// Допустимые значения availability — UI и форма работают с этим списком.
const doctorAvailabilities = ['Available', 'Busy', 'Off duty'];

/// Допустимые специальности (используются и для фильтра, и для формы).
const doctorSpecialties = [
  'General',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
];

@immutable
class Doctor {
  final String id;
  final String name;
  final String specialty;
  final String schedule;
  final String availability;
  final String phone;
  final String email;
  final String address;
  final DateTime? createdAt;

  const Doctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.schedule,
    required this.availability,
    required this.phone,
    required this.email,
    required this.address,
    this.createdAt,
  });

  // ── Производные поля (не хранятся, считаются из name/availability) ──

  String get initials => AvatarStyle.initialsOf(name);
  Color get avatarColor => AvatarStyle.colorFor(name);
  Color get availabilityColor => availabilityColorOf(availability);

  // ── Firestore (de)serialization ──

  factory Doctor.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? const <String, dynamic>{};
    return Doctor(
      id: doc.id,
      name: (data['name'] as String?) ?? '',
      specialty: (data['specialty'] as String?) ?? '',
      schedule: (data['schedule'] as String?) ?? '',
      availability: (data['availability'] as String?) ?? 'Available',
      phone: (data['phone'] as String?) ?? '',
      email: (data['email'] as String?) ?? '',
      address: (data['address'] as String?) ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  /// Поля для записи в Firestore. `id` не пишем — он лежит в имени документа.
  /// `createdAt` подставит сервер при создании (см. DoctorRepository.add).
  Map<String, Object?> toCreate() => {
        'name': name,
        'specialty': specialty,
        'schedule': schedule,
        'availability': availability,
        'phone': phone,
        'email': email,
        'address': address,
        'createdAt': FieldValue.serverTimestamp(),
      };

  /// Для update — без createdAt (его не перезаписываем).
  Map<String, Object?> toUpdate() => {
        'name': name,
        'specialty': specialty,
        'schedule': schedule,
        'availability': availability,
        'phone': phone,
        'email': email,
        'address': address,
      };

  Doctor copyWith({
    String? name,
    String? specialty,
    String? schedule,
    String? availability,
    String? phone,
    String? email,
    String? address,
  }) {
    return Doctor(
      id: id,
      name: name ?? this.name,
      specialty: specialty ?? this.specialty,
      schedule: schedule ?? this.schedule,
      availability: availability ?? this.availability,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      createdAt: createdAt,
    );
  }
}
