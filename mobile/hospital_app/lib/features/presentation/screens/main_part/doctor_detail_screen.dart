import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor_detail/doctor_detail_bloc.dart';
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

class DoctorDetailScreen extends StatelessWidget {
  final DoctorDetailData doctor;

  const DoctorDetailScreen({super.key, required this.doctor});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => DoctorDetailBloc(),
      child: _DoctorDetailView(doctor: doctor),
    );
  }
}

class _DoctorDetailView extends StatelessWidget {
  final DoctorDetailData doctor;

  const _DoctorDetailView({required this.doctor});

  @override
  Widget build(BuildContext context) {
    final d = doctor;
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
                onBack: () => Navigator.pop(context),
                actions: const [
                  MedlinkNotificationButton(),
                  SizedBox(width: 10),
                  MedlinkGridButton(),
                  SizedBox(width: 10),
                ],
              ),
              const SizedBox(height: 24),
              _buildDoctorHeader(d),
              const SizedBox(height: 16),
              Text(
                d.description,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 16),
              _ContactRow(icon: Icons.phone_outlined, text: d.phone),
              const SizedBox(height: 10),
              _ContactRow(icon: Icons.email_outlined, text: d.email),
              const SizedBox(height: 10),
              _ContactRow(icon: Icons.location_on_outlined, text: d.location),
              const SizedBox(height: 24),
              _buildStatsRow(d),
              const SizedBox(height: 20),
              const _PerformanceCard(),
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
          decoration: BoxDecoration(color: d.avatarColor, borderRadius: BorderRadius.circular(16)),
          child: Center(
            child: Text(d.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 20)),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(d.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Row(
                children: [
                  Text(d.specialty, style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                  const Text(' · ', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                  Text(d.experience, style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                ],
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: d.availabilityColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  d.availability,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: d.availabilityColor),
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
        _DoctorStatItem(value: '${d.patients}', label: 'Patients'),
        _statDivider(),
        _DoctorStatItem(value: '${d.appointments}', label: 'Appts'),
        _statDivider(),
        _DoctorStatItem(
          value: d.rating.toString(),
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
}

class _PerformanceCard extends StatelessWidget {
  const _PerformanceCard();

  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  static const _values = [72.0, 85.0, 68.0, 90.0, 78.0, 82.0];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DoctorDetailBloc, DoctorDetailState>(
      builder: (context, state) {
        return Container(
          padding: const EdgeInsets.all(18),
          decoration: AppDecorations.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Performance', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
                  Container(
                    decoration: BoxDecoration(color: AppColors.bgGrey, borderRadius: BorderRadius.circular(20)),
                    child: Row(
                      children: [
                        _toggleChip(context, 'Weekly', state.chartPeriod == 0, 0),
                        _toggleChip(context, 'Monthly', state.chartPeriod == 1, 1),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 120,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(_months.length, (i) {
                    final h = _values[i] / 100 * 90;
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          width: 30,
                          height: h,
                          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(5)),
                        ),
                        const SizedBox(height: 6),
                        Text(_months[i], style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
                      ],
                    );
                  }),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _toggleChip(BuildContext context, String label, bool selected, int period) {
    return GestureDetector(
      onTap: () => context.read<DoctorDetailBloc>().add(DoctorDetailChartToggled(period)),
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
}

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
        Text(text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _DoctorStatItem extends StatelessWidget {
  final String value;
  final String label;
  final Widget? trailing;

  const _DoctorStatItem({required this.value, required this.label, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            if (trailing != null) ...[
              const SizedBox(width: 2),
              trailing!,
            ],
          ],
        ),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
      ],
    );
  }
}
