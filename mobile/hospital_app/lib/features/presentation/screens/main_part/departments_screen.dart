import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/main_part/department_detail_screen.dart';

class DepartmentsScreen extends StatelessWidget {
  const DepartmentsScreen({super.key});

  static const _departments = [
    _DeptData(name: 'Cardiology', doctors: 12, patients: 245, head: 'Dr. Sarah Kim', color: Color(0xFFEF4444)),
    _DeptData(name: 'Orthopedics', doctors: 8, patients: 180, head: 'Dr. Daniel Dneng', color: Color(0xFFF59E0B)),
    _DeptData(name: 'Dermatology', doctors: 6, patients: 310, head: 'Dr. Nina Alvarez', color: Color(0xFF8B5CF6)),
    _DeptData(name: 'Pediatrics', doctors: 10, patients: 195, head: 'Dr. Amelia Hart', color: Color(0xFF3B82F6)),
    _DeptData(name: 'General Medicine', doctors: 15, patients: 420, head: 'Dr. Kim Young', color: AppColors.primary),
    _DeptData(name: 'Neurology', doctors: 5, patients: 88, head: 'Dr. James Lee', color: Color(0xFFEC4899)),
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
                subtitle: 'Departments',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'Departments',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),

              // ── Summary Cards ──
              _buildSummaryRow(),
              const SizedBox(height: 16),

              // ── Department List ──
              ..._departments.map((d) => _buildDeptCard(context, d)),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow() {
    final items = [
      _SummaryItem(val: '8', label: 'Total Depts', color: AppColors.primary),
      _SummaryItem(val: '24', label: 'Doctors', color: const Color(0xFF3B82F6)),
      _SummaryItem(val: '45', label: 'Nurses', color: const Color(0xFF8B5CF6)),
    ];
    return Row(
      children: items.map((s) {
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: s != items.last ? 10 : 0),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: AppShadows.cardLight,
              border: Border(left: BorderSide(color: s.color, width: 3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.val,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(s.label, style: const TextStyle(fontSize: 10, color: AppColors.textTertiary)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDeptCard(BuildContext context, _DeptData d) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => DepartmentDetailScreen(department: d.name, color: d.color)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: AppShadows.cardLight,
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: d.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(color: d.color, shape: BoxShape.circle),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(d.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                      const SizedBox(height: 2),
                      Text(d.head, style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, size: 16, color: AppColors.textTertiary),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.only(top: 12),
              decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
              child: Row(
                children: [
                  RichText(
                    text: TextSpan(children: [
                      TextSpan(text: '${d.doctors}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textPrimary)),
                      const TextSpan(text: ' Doctors', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ]),
                  ),
                  const SizedBox(width: 16),
                  RichText(
                    text: TextSpan(children: [
                      TextSpan(text: '${d.patients}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textPrimary)),
                      const TextSpan(text: ' Patients', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ]),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeptData {
  final String name;
  final int doctors;
  final int patients;
  final String head;
  final Color color;
  const _DeptData({required this.name, required this.doctors, required this.patients, required this.head, required this.color});
}

class _SummaryItem {
  final String val;
  final String label;
  final Color color;
  const _SummaryItem({required this.val, required this.label, required this.color});
}
