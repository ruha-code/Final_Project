import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF1DB87A);
  static const Color primaryDark = Color(0xFF1A1A2E);
  static const Color accent = Color(0xFF6C63FF);
  static const Color pink = Color(0xFFFF6584);
  static const Color orange = Color(0xFFFF9F43);
  static const Color red = Color(0xFFFF4757);
  static const Color dark = Color(0xFF2D2D3A);

  static const Color bgGrey = Color(0xFFF5F5F5);
  static const Color border = Color(0xFFF0F0F0);
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Colors.black45;
  static const Color textTertiary = Colors.black38;
}

class AppShadows {
  AppShadows._();

  static List<BoxShadow> get card => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get cardLight => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];
}

class AppDecorations {
  AppDecorations._();

  static BoxDecoration get card => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadows.cardLight,
      );
}