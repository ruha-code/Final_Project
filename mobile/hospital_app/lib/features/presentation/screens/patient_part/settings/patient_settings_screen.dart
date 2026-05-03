import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/settings/change_email_screen.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/settings/change_password_screen.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

/// Главная страница Settings: список пунктов + sign out.
class PatientSettingsScreen extends StatelessWidget {
  const PatientSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = context.select((AuthBloc b) => b.state.user?.uid);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: const Text('Settings',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          _SectionLabel(label: 'Account'),
          _SettingsTile(
            icon: Icons.lock_outline,
            label: 'Change password',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => const ChangePasswordScreen()),
            ),
          ),
          _SettingsTile(
            icon: Icons.alternate_email,
            label: 'Change email',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => const ChangeEmailScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _SectionLabel(label: 'Preferences'),
          if (uid != null) _NotificationsToggle(uid: uid),
          const SizedBox(height: 24),
          // Sign out — отдельным блоком, выделяется красным.
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () => _confirmSignOut(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.red,
                  side: const BorderSide(color: AppColors.red),
                ),
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Sign out'),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You will need to sign in again next time.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign out',
                style: TextStyle(color: AppColors.red)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    context.read<AuthBloc>().add(const AuthSignOutRequested());
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textTertiary,
            letterSpacing: 0.8),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Widget? trailing = null;

  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(label,
          style: const TextStyle(
              fontWeight: FontWeight.w500, fontSize: 14)),
      trailing: trailing ??
          const Icon(Icons.chevron_right,
              color: AppColors.textTertiary, size: 20),
    );
  }
}

class _NotificationsToggle extends StatelessWidget {
  final String uid;
  const _NotificationsToggle({required this.uid});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .snapshots(),
      builder: (ctx, snap) {
        final data = snap.data?.data() ?? const <String, dynamic>{};
        final enabled = (data['notificationsEnabled'] as bool?) ?? true;
        return ListTile(
          leading:
              const Icon(Icons.notifications_none, color: AppColors.textSecondary),
          title: const Text('Notifications',
              style: TextStyle(
                  fontWeight: FontWeight.w500, fontSize: 14)),
          trailing: Switch(
            value: enabled,
            activeThumbColor: AppColors.primary,
            onChanged: (v) => context
                .read<AuthRepository>()
                .setNotificationsEnabled(v)
                .catchError((Object e) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text('Failed: $e'),
                backgroundColor: Colors.red,
              ));
            }),
          ),
        );
      },
    );
  }
}
