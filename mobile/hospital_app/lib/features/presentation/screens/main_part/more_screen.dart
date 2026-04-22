import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/main_part/departments_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/calendar_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/inventory_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/messages_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/notifications_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/privacy_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/help_center_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/about_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const TopNavBar(subtitle: 'More options'),
              const SizedBox(height: 24),
              const Text(
                'More',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),

              // ── Profile Card ──
              _buildProfileCard(context),
              const SizedBox(height: 16),

              // ── Menu Items ──
              _buildMenuItem(
                context,
                icon: Icons.local_hospital_rounded,
                label: 'Departments',
                desc: 'View all departments',
                bgColor: const Color(0xFFECFDF5),
                screen: const DepartmentsScreen(),
              ),
              _buildMenuItem(
                context,
                icon: Icons.calendar_month_rounded,
                label: 'Calendar',
                desc: 'Schedule & events',
                bgColor: const Color(0xFFEFF6FF),
                screen: const CalendarScreen(),
              ),
              _buildMenuItem(
                context,
                icon: Icons.inventory_2_rounded,
                label: 'Inventory',
                desc: 'Medical supplies',
                bgColor: const Color(0xFFFEF3C7),
                screen: const InventoryScreen(),
              ),
              _buildMenuItem(
                context,
                icon: Icons.chat_bubble_outline_rounded,
                label: 'Messages',
                desc: 'Chat with staff',
                bgColor: const Color(0xFFF0FDFA),
                screen: const MessagesScreen(),
              ),
              const SizedBox(height: 24),

              // ── Settings ──
              const Text(
                'SETTINGS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textTertiary,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 10),
              ..._settingsItems(context),
              const SizedBox(height: 20),

              // ── Upgrade Banner ──
              _buildUpgradeBanner(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileCard(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/profile'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppDecorations.card,
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(26),
              ),
              child: const Center(
                child: Text(
                  'R',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ruslan',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Admin',
                    style: TextStyle(fontSize: 12, color: AppColors.textTertiary),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 20, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String desc,
    required Color bgColor,
    required Widget screen,
  }) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => screen),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: AppShadows.cardLight,
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 22, color: AppColors.textPrimary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }

  List<Widget> _settingsItems(BuildContext context) {
    final items = <_SettingsItem>[
      _SettingsItem(label: 'Notifications', screen: const NotificationsScreen()),
      _SettingsItem(label: 'Privacy', screen: const PrivacyScreen()),
      _SettingsItem(label: 'Help Center', screen: const HelpCenterScreen()),
      _SettingsItem(label: 'About', screen: const AboutScreen()),
    ];

    return List.generate(items.length, (i) {
      final item = items[i];
      return GestureDetector(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => item.screen),
        ),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            border: i < items.length - 1
                ? const Border(bottom: BorderSide(color: AppColors.border))
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                item.label,
                style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
              ),
              const Icon(Icons.chevron_right, size: 16, color: AppColors.textTertiary),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildUpgradeBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF0D9488)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Upgrade to Pro',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Unlock all features',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Text(
              'Upgrade',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsItem {
  final String label;
  final Widget screen;
  const _SettingsItem({required this.label, required this.screen});
}
