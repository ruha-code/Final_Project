import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/help_center/help_center_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  static const _faqs = <_Faq>[
    _Faq(
      q: 'How do I add a new patient?',
      a: 'Go to Patients tab, tap the + button in the bottom right, and fill out the patient registration form with their details.',
    ),
    _Faq(
      q: 'How to schedule an appointment?',
      a: "Navigate to the Appointments tab, select a date, and tap 'New Appointment'. Choose the patient, doctor, and time slot.",
    ),
    _Faq(
      q: 'Can I export patient records?',
      a: "Yes! Go to the patient's detail page, scroll to Health Reports, and tap the export icon to download as PDF.",
    ),
    _Faq(
      q: 'How to manage inventory?',
      a: 'Access Inventory from the More menu. You can track stock levels, set low-stock alerts, and place orders directly.',
    ),
    _Faq(
      q: 'How do I reset my password?',
      a: "Go to Profile > Security > Change Password. You'll receive a verification code via email to complete the reset.",
    ),
  ];

  static const _quickActions = <_QuickAction>[
    _QuickAction(icon: Icons.chat_bubble_outline_rounded, label: 'Live Chat', bgColor: Color(0xFFECFDF5)),
    _QuickAction(icon: Icons.email_outlined, label: 'Email Us', bgColor: Color(0xFFEFF6FF)),
    _QuickAction(icon: Icons.phone_outlined, label: 'Call', bgColor: Color(0xFFFEF3C7)),
  ];

  static const _guides = <_Guide>[
    _Guide(title: 'Quick Start Guide', time: '5 min read', icon: Icons.menu_book_outlined),
    _Guide(title: 'Managing Patients', time: '8 min read', icon: Icons.people_outline),
    _Guide(title: 'Inventory Setup', time: '4 min read', icon: Icons.inventory_2_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => HelpCenterBloc(),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                TopNavBar(
                  subtitle: 'Help Center',
                  onBack: () => Navigator.pop(context),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Help Center',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 16),
                _buildSearchBar(),
                const SizedBox(height: 12),
                _buildQuickActions(),
                const SizedBox(height: 12),
                const _FaqsCard(faqs: _faqs),
                const SizedBox(height: 12),
                _buildGuides(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: AppShadows.cardLight,
      ),
      child: const Row(
        children: [
          Icon(Icons.search, size: 16, color: AppColors.textTertiary),
          SizedBox(width: 10),
          Text('Search for help...', style: TextStyle(fontSize: 14, color: AppColors.textTertiary)),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: List.generate(_quickActions.length, (i) {
        final a = _quickActions[i];
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < _quickActions.length - 1 ? 10 : 0),
            child: GestureDetector(
              onTap: () {},
              behavior: HitTestBehavior.opaque,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: AppShadows.cardLight,
                ),
                child: Column(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: a.bgColor, borderRadius: BorderRadius.circular(10)),
                      child: Icon(a.icon, size: 18, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    Text(a.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  ],
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildGuides() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Getting Started', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 10),
          ...List.generate(_guides.length, (i) {
            final g = _guides[i];
            return GestureDetector(
              onTap: () {},
              behavior: HitTestBehavior.opaque,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  border: i < _guides.length - 1
                      ? const Border(bottom: BorderSide(color: AppColors.border))
                      : null,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                      child: Icon(g.icon, size: 18, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(g.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                          const SizedBox(height: 2),
                          Text(g.time, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 16, color: AppColors.textTertiary),
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

class _FaqsCard extends StatelessWidget {
  final List<_Faq> faqs;
  const _FaqsCard({required this.faqs});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HelpCenterBloc, HelpCenterState>(
      builder: (context, state) {
        return Container(
          padding: const EdgeInsets.all(18),
          decoration: AppDecorations.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Frequently Asked', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
              const SizedBox(height: 10),
              ...List.generate(faqs.length, (i) {
                final f = faqs[i];
                final isOpen = state.openFaqIndex == i;
                return Container(
                  decoration: BoxDecoration(
                    border: i < faqs.length - 1
                        ? const Border(bottom: BorderSide(color: AppColors.border))
                        : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: () => context.read<HelpCenterBloc>().add(HelpCenterFaqToggled(i)),
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          child: Row(
                            children: [
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(right: 10),
                                  child: Text(f.q, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                                ),
                              ),
                              AnimatedRotation(
                                duration: const Duration(milliseconds: 200),
                                turns: isOpen ? 0.5 : 0,
                                child: const Icon(Icons.keyboard_arrow_down, size: 18, color: AppColors.textTertiary),
                              ),
                            ],
                          ),
                        ),
                      ),
                      AnimatedCrossFade(
                        duration: const Duration(milliseconds: 200),
                        crossFadeState: isOpen ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                        firstChild: const SizedBox(width: double.infinity),
                        secondChild: Padding(
                          padding: const EdgeInsets.only(bottom: 13),
                          child: Text(
                            f.a,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.6),
                          ),
                        ),
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

class _Faq {
  final String q;
  final String a;
  const _Faq({required this.q, required this.a});
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color bgColor;
  const _QuickAction({required this.icon, required this.label, required this.bgColor});
}

class _Guide {
  final String title;
  final String time;
  final IconData icon;
  const _Guide({required this.title, required this.time, required this.icon});
}
