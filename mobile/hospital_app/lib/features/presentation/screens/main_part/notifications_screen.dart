import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/notifications/notifications_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/toggle_switch.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  static const _channels = <_NotificationItem>[
    _NotificationItem(key: 'push', label: 'Push Notifications', desc: 'Show on lock screen'),
    _NotificationItem(key: 'email', label: 'Email Notifications', desc: 'Send to ruslan@medlink.com'),
    _NotificationItem(key: 'sms', label: 'SMS Notifications', desc: 'Send to +7 701 234 5678'),
  ];

  static const _categories = <_NotificationItem>[
    _NotificationItem(key: 'appointments', label: 'Appointments', desc: 'Reminders & changes'),
    _NotificationItem(key: 'messages', label: 'Messages', desc: 'New messages from staff'),
    _NotificationItem(key: 'updates', label: 'System Updates', desc: 'App & feature updates'),
    _NotificationItem(key: 'alerts', label: 'Critical Alerts', desc: 'Emergencies & urgent items'),
  ];

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
              TopNavBar(
                subtitle: 'Notifications',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'Notifications',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              const _Section(title: 'Channels', items: _channels),
              const SizedBox(height: 12),
              const _Section(title: 'Categories', items: _categories),
              const SizedBox(height: 12),
              const _QuietHours(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<_NotificationItem> items;
  const _Section({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NotificationsBloc, NotificationsState>(
      builder: (context, state) {
        return Container(
          padding: const EdgeInsets.all(18),
          decoration: AppDecorations.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 10),
              ...List.generate(items.length, (i) {
                final n = items[i];
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    border: i < items.length - 1
                        ? const Border(bottom: BorderSide(color: AppColors.border))
                        : null,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                            const SizedBox(height: 2),
                            Text(n.desc, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                          ],
                        ),
                      ),
                      ToggleSwitch(
                        value: state.valueOf(n.key),
                        onChanged: () => context.read<NotificationsBloc>().add(NotificationToggled(n.key)),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class _QuietHours extends StatelessWidget {
  const _QuietHours();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NotificationsBloc, NotificationsState>(
      builder: (context, state) {
        return Container(
          padding: const EdgeInsets.all(18),
          decoration: AppDecorations.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quiet Hours',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Do Not Disturb', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                        SizedBox(height: 2),
                        Text('10:00 PM — 7:00 AM', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                      ],
                    ),
                  ),
                  ToggleSwitch(
                    value: state.valueOf('dnd'),
                    onChanged: () => context.read<NotificationsBloc>().add(NotificationToggled('dnd')),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NotificationItem {
  final String key;
  final String label;
  final String desc;
  const _NotificationItem({required this.key, required this.label, required this.desc});
}
