import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/privacy/privacy_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/toggle_switch.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  static const _visibility = <_PrivacyItem>[
    _PrivacyItem(key: 'online', label: 'Show Online Status', desc: "Others can see when you're active"),
    _PrivacyItem(key: 'readReceipts', label: 'Read Receipts', desc: "Show when you've read messages"),
  ];

  static const _data = <_PrivacyItem>[
    _PrivacyItem(key: 'analytics', label: 'Usage Analytics', desc: 'Help improve Medlink'),
    _PrivacyItem(key: 'location', label: 'Location Access', desc: 'For nearby services'),
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
                subtitle: 'Privacy',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'Privacy',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              const _ToggleSection(title: 'Visibility', items: _visibility),
              const SizedBox(height: 12),
              const _ToggleSection(title: 'Data & Permissions', items: _data),
              const SizedBox(height: 12),
              const _DataManagementCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToggleSection extends StatelessWidget {
  final String title;
  final List<_PrivacyItem> items;
  const _ToggleSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PrivacyBloc, PrivacyState>(
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
                        onChanged: () => context.read<PrivacyBloc>().add(PrivacyToggled(n.key)),
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

class _DataManagementCard extends StatelessWidget {
  const _DataManagementCard();

  static const _actions = <_PrivacyAction>[
    _PrivacyAction(label: 'Download My Data', desc: 'Export all your personal data', color: AppColors.primary, kind: _ActionKind.download),
    _PrivacyAction(label: 'Clear Cache', desc: 'Free up 128 MB of storage', color: Color(0xFFF59E0B), kind: _ActionKind.clearCache),
    _PrivacyAction(label: 'Delete Account', desc: 'Permanently remove your account', color: Color(0xFFEF4444), kind: _ActionKind.deleteAccount),
  ];

  Future<void> _confirmDelete(BuildContext context) async {
    await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Account?',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17, color: AppColors.textPrimary),
        ),
        content: const Text(
          'This will permanently remove your account and all associated data. This action cannot be undone.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Data Management',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          ...List.generate(_actions.length, (i) {
            final a = _actions[i];
            return GestureDetector(
              onTap: () {
                if (a.kind == _ActionKind.deleteAccount) {
                  _confirmDelete(context);
                }
              },
              behavior: HitTestBehavior.opaque,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: i < _actions.length - 1
                      ? const Border(bottom: BorderSide(color: AppColors.border))
                      : null,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a.label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                          const SizedBox(height: 2),
                          Text(a.desc, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, size: 16, color: a.color),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

enum _ActionKind { download, clearCache, deleteAccount }

class _PrivacyItem {
  final String key;
  final String label;
  final String desc;
  const _PrivacyItem({required this.key, required this.label, required this.desc});
}

class _PrivacyAction {
  final String label;
  final String desc;
  final Color color;
  final _ActionKind kind;
  const _PrivacyAction({
    required this.label,
    required this.desc,
    required this.color,
    required this.kind,
  });
}
