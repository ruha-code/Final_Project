import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DoctorDetailData {
  final String name;
  final String initials;
  final Color avatarColor;
  final String specialty;
  final String experience;
  final String availability;
  final Color availabilityColor;
  final String description;
  final String phone;
  final String email;
  final String location;
  final int patients;
  final int appointments;
  final double rating;

  const DoctorDetailData({
    required this.name,
    required this.initials,
    required this.avatarColor,
    required this.specialty,
    required this.experience,
    required this.availability,
    required this.availabilityColor,
    required this.description,
    required this.phone,
    required this.email,
    required this.location,
    required this.patients,
    required this.appointments,
    required this.rating,
  });
}

class DoctorDetailScreen extends StatefulWidget {
  final DoctorDetailData doctor;

  const DoctorDetailScreen({super.key, required this.doctor});

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  int _chartToggle = 1; // 0 = Weekly, 1 = Monthly

  @override
  Widget build(BuildContext context) {
    final d = widget.doctor;
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
                subtitle: 'Doctor detail',
                actions: const [
                  MedlinkNotificationButton(),
                  SizedBox(width: 10),
                  MedlinkGridButton(),
                  SizedBox(width: 10),
                ],
              ),
              const SizedBox(height: 24),

              // ── Doctor header ──
              _buildDoctorHeader(d),
              const SizedBox(height: 16),

              // ── Description ──
              Text(
                d.description,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // ── Contact info ──
              _ContactRow(icon: Icons.phone_outlined, text: d.phone),
              const SizedBox(height: 10),
              _ContactRow(icon: Icons.email_outlined, text: d.email),
              const SizedBox(height: 10),
              _ContactRow(icon: Icons.location_on_outlined, text: d.location),
              const SizedBox(height: 24),

              // ── Stats row ──
              _buildStatsRow(d),
              const SizedBox(height: 24),

              // ── Patient Overview chart ──
              _buildPatientOverviewCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDoctorHeader(DoctorDetailData d) {
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: d.avatarColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Text(
              d.initials,
              style: TextStyle(
                color: d.avatarColor,
                fontWeight: FontWeight.w700,
                fontSize: 22,
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                d.name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${d.specialty} - ${d.experience}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textTertiary,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: d.availabilityColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  d.availability,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: d.availabilityColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow(DoctorDetailData d) {
    return Row(
      children: [
        Expanded(
          child: _DoctorStatCard(
            value: d.patients.toString(),
            label: 'Patients',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _DoctorStatCard(
            value: d.appointments.toString(),
            label: 'Appointments',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _DoctorStatCard(
            value: d.rating.toString(),
            label: 'Rating',
            icon: Icons.star_rounded,
            iconColor: AppColors.orange,
          ),
        ),
      ],
    );
  }

  Widget _buildPatientOverviewCard() {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    final inpatient =  [50.0, 40.0, 55.0, 65.0, 45.0, 60.0, 50.0];
    final outpatient = [35.0, 30.0, 40.0, 45.0, 35.0, 40.0, 30.0];

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
              const Text(
                'Patient Overview',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _chartToggle = _chartToggle == 0 ? 1 : 0),
                child: Text(
                  _chartToggle == 1 ? 'Monthly' : 'Weekly',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Legend
          Row(
            children: [
              _legendDot(AppColors.primaryDark, 'Inpatient'),
              const SizedBox(width: 16),
              _legendDot(AppColors.primary, 'Outpatient'),
            ],
          ),
          const SizedBox(height: 16),
          // Stacked bars
          SizedBox(
            height: 130,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(months.length, (i) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    SizedBox(
                      width: 28,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Container(
                            width: 28,
                            height: inpatient[i] / 1.5,
                            decoration: const BoxDecoration(
                              color: AppColors.primaryDark,
                              borderRadius: BorderRadius.vertical(
                                top: Radius.circular(4),
                              ),
                            ),
                          ),
                          Container(
                            width: 28,
                            height: outpatient[i] / 1.5,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.vertical(
                                bottom: Radius.circular(4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      months[i],
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

class _DoctorStatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData? icon;
  final Color? iconColor;

  const _DoctorStatCard({
    required this.value,
    required this.label,
    this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: AppDecorations.card,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: iconColor),
                const SizedBox(width: 4),
              ],
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}
