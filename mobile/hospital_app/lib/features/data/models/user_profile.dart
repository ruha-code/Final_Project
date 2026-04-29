import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Роли в системе. Значения совпадают с тем, что лежит в Firestore.
enum UserRole {
  doctor,
  patient,
  unknown;

  static UserRole fromString(String? raw) {
    switch (raw) {
      case 'doctor':
        return UserRole.doctor;
      case 'patient':
        return UserRole.patient;
      default:
        return UserRole.unknown;
    }
  }

  String get asString {
    switch (this) {
      case UserRole.doctor:
        return 'doctor';
      case UserRole.patient:
        return 'patient';
      case UserRole.unknown:
        return 'unknown';
    }
  }
}

/// Профиль юзера: хранится в `users/{uid}`. Связывает Firebase Auth
/// (uid, email, displayName) с ролью в системе и с конкретным документом
/// в `doctors/`/`patients/` (там id == uid, поэтому отдельное поле не нужно).
@immutable
class UserProfile {
  final String uid;
  final UserRole role;
  final String displayName;
  final String email;

  const UserProfile({
    required this.uid,
    required this.role,
    required this.displayName,
    required this.email,
  });

  factory UserProfile.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? const <String, dynamic>{};
    return UserProfile(
      uid: doc.id,
      role: UserRole.fromString(data['role'] as String?),
      displayName: (data['displayName'] as String?) ?? '',
      email: (data['email'] as String?) ?? '',
    );
  }

  Map<String, Object?> toMap() => {
        'role': role.asString,
        'displayName': displayName,
        'email': email,
      };
}
