import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DepartmentDetailScreen extends StatelessWidget {
  final String department;
  final Color color;

  const DepartmentDetailScreen({
    super.key,
    required this.department,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    TopNavBar(
                      subtitle: 'Department detail',
                      onBack: () => Navigator.pop(context),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      '$department Department',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ── Banner ──
              _buildBanner(),
              const SizedBox(height: 12),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    // ── About ──
                    _buildAboutCard(),
                    const SizedBox(height: 12),

                    // ── Staff ──
                    _buildStaffCard(),
                    const SizedBox(height: 12),

                    // ── Performance ──
                    _buildPerformanceCard(),
                    const SizedBox(height: 12),

                    // ── Recent Appointments ──
                    _buildAppointmentsCard(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      height: 160,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [const Color(0xFF0D9488), AppColors.primary]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.monitor_heart_outlined, size: 40, color: Colors.white),
            const SizedBox(height: 8),
            Text(
              department,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAboutCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('About', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          const Text(
            'Specializes in the diagnosis and treatment of heart diseases. Providing comprehensive cardiovascular care with state-of-the-art equipment.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.6),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _infoChip(Icons.people_outline, '12 Doctors'),
              const SizedBox(width: 12),
              _infoChip(Icons.bed_outlined, '45 Beds'),
              const SizedBox(width: 12),
              _infoChip(Icons.location_on_outlined, '4th Floor'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildStaffCard() {
    const staff = [
      _StaffData(name: 'Dr. Sarah Kim', role: 'Head of Dept.', initials: 'SK', color: Color(0xFFEF4444)),
      _StaffData(name: 'Dr. Mike Patel', role: 'Senior Cardiologist', initials: 'MP', color: Color(0xFF3B82F6)),
      _StaffData(name: 'Dr. Ana Chen', role: 'Cardiologist', initials: 'AC', color: Color(0xFF8B5CF6)),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Staff', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...List.generate(staff.length, (i) {
            final s = staff[i];
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: i < staff.length - 1
                    ? const Border(bottom: BorderSide(color: AppColors.border))
                    : null,
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: s.color.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        s.initials,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: s.color),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
                        const SizedBox(height: 1),
                        Text(s.role, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                      ],
                    ),
                  ),
                  _smallIconButton(Icons.phone_outlined),
                  const SizedBox(width: 8),
                  _smallIconButton(Icons.email_outlined),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _smallIconButton(IconData icon) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 12, color: AppColors.primary),
    );
  }

  Widget _buildPerformanceCard() {
    final data = [
      _PerfData('Jan', 72),
      _PerfData('Feb', 85),
      _PerfData('Mar', 68),
      _PerfData('Apr', 90),
      _PerfData('May', 78),
      _PerfData('Jun', 82),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Performance', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 4),
          const Text('Patient satisfaction (%)', style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
          const SizedBox(height: 14),
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((d) {
                final h = d.val / 100 * 90;
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      width: 30,
                      height: h,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(d.month, style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentsCard() {
    const appts = [
      _ApptData(time: '09:00 AM', patient: 'John Doe', type: 'Checkup', status: 'Completed'),
      _ApptData(time: '10:30 AM', patient: 'Emily Rose', type: 'Echo Test', status: 'Active'),
      _ApptData(time: '02:00 PM', patient: 'Alan Smith', type: 'Follow-up', status: 'Upcoming'),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Recent Appointments', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...List.generate(appts.length, (i) {
            final a = appts[i];
            final statusColor = a.status == 'Completed'
                ? AppColors.primary
                : a.status == 'Active'
                    ? AppColors.orange
                    : const Color(0xFF3B82F6);
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: i < appts.length - 1
                    ? const Border(bottom: BorderSide(color: AppColors.border))
                    : null,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a.patient, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 2),
                      Text('${a.time} · ${a.type}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      a.status,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusColor),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _StaffData {
  final String name, role, initials;
  final Color color;
  const _StaffData({required this.name, required this.role, required this.initials, required this.color});
}

class _PerfData {
  final String month;
  final double val;
  const _PerfData(this.month, this.val);
}

class _ApptData {
  final String time, patient, type, status;
  const _ApptData({required this.time, required this.patient, required this.type, required this.status});
}
