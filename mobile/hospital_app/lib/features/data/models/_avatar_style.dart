import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

/// Утилиты для производных полей: инициалы из имени, цвет аватарки из имени,
/// цвет бейджа из статуса. Хранить эти штуки в Firestore нет смысла — они
/// детерминированы и легко считаются на клиенте.
class AvatarStyle {
  AvatarStyle._();

  static const _palette = [
    AppColors.primary,
    AppColors.accent,
    AppColors.pink,
    AppColors.orange,
    AppColors.dark,
    AppColors.red,
  ];

  /// Стабильный цвет: одно и то же имя всегда даёт один и тот же цвет.
  static Color colorFor(String name) {
    if (name.isEmpty) return AppColors.dark;
    final idx = name.codeUnits.fold<int>(0, (a, b) => a + b) % _palette.length;
    return _palette[idx];
  }

  /// Первые буквы первого и последнего слов (или первая буква, если слово одно).
  static String initialsOf(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }
}

/// Цвет бейджа доступности доктора: Available — зелёный, Busy — оранжевый,
/// всё остальное (Off duty / Vacation / etc.) — серый.
Color availabilityColorOf(String availability) {
  switch (availability.toLowerCase()) {
    case 'available':
      return AppColors.primary;
    case 'busy':
      return AppColors.orange;
    default:
      return AppColors.textTertiary;
  }
}

/// Цвет статуса пациента: Admitted — зелёный, Critical — красный,
/// Discharged — серый, иначе — accent.
Color patientStatusColorOf(String status) {
  switch (status.toLowerCase()) {
    case 'admitted':
    case 'stable':
      return AppColors.primary;
    case 'critical':
      return AppColors.red;
    case 'discharged':
      return AppColors.textTertiary;
    default:
      return AppColors.accent;
  }
}
