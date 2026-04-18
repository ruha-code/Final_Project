import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class PatientDetailData {
  final String name;
  final String initials;
  final Color avatarColor;
  final String patientId;
  final String condition;
  final String doctor;
  final String department;
  final String phone;
  final String email;
  final String location;
  final int age;
  final String bloodType;
  final String weight;
  final double rating;
  final String bloodSugar;
  final String temperature;

  const PatientDetailData({
    required this.name,
    required this.initials,
    required this.avatarColor,
    required this.patientId,
    required this.condition,
    required this.doctor,
    required this.department,
    required this.phone,
    required this.email,
    required this.location,
    required this.age,
    required this.bloodType,
    required this.weight,
    required this.rating,
    this.bloodSugar = '171',
    this.temperature = '37',
  });
}

class PatientDetailScreen extends StatefulWidget {
  final PatientDetailData patient;

  const PatientDetailScreen({super.key, required this.patient});

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  int _bpToggle = 1; // 0 = Weekly, 1 = Monthly

  @override
  Widget build(BuildContext context) {
    final p = widget.patient;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const TopNavBar(subtitle: 'Patient detail'),
              const SizedBox(height: 24),

              // ── Patient header ──
              _buildPatientHeader(p),
              const SizedBox(height: 16),

              // ── Condition text ──
              Text(
                'Condition: ${p.condition}. Currently under care of ${p.doctor}, ${p.department} department.',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // ── Contact info ──
              _ContactRow(icon: Icons.phone_outlined, text: p.phone),
              const SizedBox(height: 10),
              _ContactRow(icon: Icons.email_outlined, text: p.email),
              const SizedBox(height: 10),
              _ContactRow(icon: Icons.location_on_outlined, text: p.location),
              const SizedBox(height: 24),

              // ── Stats row ──
              _buildStatsRow(p),
              const SizedBox(height: 20),

              // ── Medical cards ──
              _buildMedicalCards(p),
              const SizedBox(height: 24),

              // ── Blood Pressure chart ──
              _buildBloodPressureCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPatientHeader(PatientDetailData p) {
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: p.avatarColor,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Text(
              p.initials,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              p.name,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              p.patientId,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsRow(PatientDetailData p) {
    return Row(
      children: [
        _StatItem(value: '${p.age}', label: 'Age'),
        _statDivider(),
        _StatItem(value: p.bloodType, label: 'Blood', icon: Icons.water_drop_outlined),
        _statDivider(),
        _StatItem(value: p.weight, label: 'Weight'),
        _statDivider(),
        _StatItem(
          value: p.rating.toString(),
          label: 'Rating',
          trailing: const Icon(Icons.star, size: 14, color: AppColors.orange),
        ),
      ],
    );
  }

  Widget _statDivider() {
    return Container(
      width: 1,
      height: 36,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: AppColors.border,
    );
  }

  Widget _buildMedicalCards(PatientDetailData p) {
    return Row(
      children: [
        Expanded(
          child: _MedicalCard(
            label: 'BLOOD SUGAR',
            value: p.bloodSugar,
            unit: 'mg/dl',
            valueColor: AppColors.primaryDark,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MedicalCard(
            label: 'WEIGHT',
            value: p.weight,
            unit: '',
            valueColor: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MedicalCard(
            label: 'TEMP',
            value: p.temperature,
            unit: '°C',
            valueColor: AppColors.primaryDark,
          ),
        ),
      ],
    );
  }

  Widget _buildBloodPressureCard() {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final systolic = [70.0, 55.0, 80.0, 60.0, 75.0, 50.0, 65.0];
    final diastolic = [45.0, 35.0, 55.0, 40.0, 50.0, 30.0, 42.0];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.primaryDark,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Blood Pressure',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              // Weekly / Monthly toggle
              Container(
                decoration: BoxDecoration(
                  color: AppColors.bgGrey,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    _toggleChip('Weekly', _bpToggle == 0, () => setState(() => _bpToggle = 0)),
                    _toggleChip('Monthly', _bpToggle == 1, () => setState(() => _bpToggle = 1)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Legend
          Row(
            children: [
              _legendDot(AppColors.primaryDark, 'Systolic'),
              const SizedBox(width: 12),
              _legendDot(AppColors.primary, 'Diastolic'),
            ],
          ),
          const SizedBox(height: 16),
          // Chart
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(days.length, (i) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          width: 10,
                          height: systolic[i],
                          decoration: BoxDecoration(
                            color: AppColors.primaryDark,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(width: 3),
                        Container(
                          width: 10,
                          height: diastolic[i],
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      days[i],
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _toggleChip(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : AppColors.textTertiary,
          ),
        ),
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
        ),
      ],
    );
  }
}

// ──────────── Small widgets ────────────

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _ContactRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 10),
        Text(
          text,
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final IconData? icon;
  final Widget? trailing;

  const _StatItem({
    required this.value,
    required this.label,
    this.icon,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: AppColors.primary),
              const SizedBox(width: 2),
            ],
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 2),
              trailing!,
            ],
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
        ),
      ],
    );
  }
}

class _MedicalCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color valueColor;

  const _MedicalCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: AppColors.textTertiary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: valueColor,
                  ),
                ),
                if (unit.isNotEmpty)
                  TextSpan(
                    text: ' $unit',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
