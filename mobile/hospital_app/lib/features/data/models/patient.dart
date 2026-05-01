import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hospital_app/features/data/models/_avatar_style.dart';

const patientWards = ['Inpatient', 'Outpatient'];
const patientStatuses = ['Admitted', 'Stable', 'Critical', 'Discharged'];
const patientGenders = ['Male', 'Female', 'Other'];

@immutable
class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String diagnosis;
  final String status;
  final String ward; // Inpatient / Outpatient
  final String? room;
  final String assignedDoctor;
  final String phone;
  final String email;
  final String address;
  final DateTime? createdAt;

  const Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.diagnosis,
    required this.status,
    required this.ward,
    required this.assignedDoctor,
    required this.phone,
    required this.email,
    required this.address,
    this.room,
    this.createdAt,
  });

  String get initials => AvatarStyle.initialsOf(name);
  Color get avatarColor => AvatarStyle.colorFor(name);
  Color get statusColor => patientStatusColorOf(status);

  factory Patient.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? const <String, dynamic>{};
    final rawRoom = data['room'] as String?;
    return Patient(
      id: doc.id,
      name: (data['name'] as String?) ?? '',
      age: (data['age'] as num?)?.toInt() ?? 0,
      gender: (data['gender'] as String?) ?? 'Other',
      diagnosis: (data['diagnosis'] as String?) ?? '',
      status: (data['status'] as String?) ?? 'Stable',
      ward: (data['ward'] as String?) ?? 'Outpatient',
      // Пустую строку трактуем как «комната не задана».
      room: (rawRoom == null || rawRoom.isEmpty) ? null : rawRoom,
      assignedDoctor: (data['assignedDoctor'] as String?) ?? '',
      phone: (data['phone'] as String?) ?? '',
      email: (data['email'] as String?) ?? '',
      address: (data['address'] as String?) ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, Object?> toCreate() => {
        'name': name,
        'age': age,
        'gender': gender,
        'diagnosis': diagnosis,
        'status': status,
        'ward': ward,
        'room': room ?? '',
        'assignedDoctor': assignedDoctor,
        'phone': phone,
        'email': email,
        'address': address,
        'createdAt': FieldValue.serverTimestamp(),
      };

  Map<String, Object?> toUpdate() => {
        'name': name,
        'age': age,
        'gender': gender,
        'diagnosis': diagnosis,
        'status': status,
        'ward': ward,
        'room': room ?? '',
        'assignedDoctor': assignedDoctor,
        'phone': phone,
        'email': email,
        'address': address,
      };

  Patient copyWith({
    String? name,
    int? age,
    String? gender,
    String? diagnosis,
    String? status,
    String? ward,
    String? room,
    bool clearRoom = false,
    String? assignedDoctor,
    String? phone,
    String? email,
    String? address,
  }) {
    return Patient(
      id: id,
      name: name ?? this.name,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      diagnosis: diagnosis ?? this.diagnosis,
      status: status ?? this.status,
      ward: ward ?? this.ward,
      room: clearRoom ? null : (room ?? this.room),
      assignedDoctor: assignedDoctor ?? this.assignedDoctor,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      createdAt: createdAt,
    );
  }
}
