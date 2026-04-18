import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/appointment_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/appointment_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/stat_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  static const _filters = ['All', 'Completed', 'Ongoing', 'Cancelled'];

  static const _appointments = [
    AppointmentData(
      name: 'Erica Smith',
      phone: '7 777 123 4567',
      initials: 'ES',
      avatarColor: AppColors.primary,
      status: 'Completed',
      statusColor: AppColors.primary,
      doctor: 'Dr. Ning',
      type: 'Consultation',
      date: '12 March',
    ),
    AppointmentData(
      name: 'John Doe',
      phone: '7 701 558 8998',
      initials: 'JD',
      avatarColor: AppColors.primary,
      status: 'Ongoing',
      statusColor: AppColors.orange,
      doctor: 'Dr. Alex',
      type: 'Follow-up',
      date: '13 March',
    ),
    AppointmentData(
      name: 'Petya Smith',
      phone: '7 702 334 5566',
      initials: 'PS',
      avatarColor: AppColors.accent,
      status: 'Cancelled',
      statusColor: AppColors.red,
      doctor: 'Dr. Amelia',
      type: 'Check-up',
      date: '14 March',
    ),
    AppointmentData(
      name: 'Anna Lee',
      phone: '7 707 112 2233',
      initials: 'AL',
      avatarColor: AppColors.pink,
      status: 'Completed',
      statusColor: AppColors.primary,
      doctor: 'Dr. Daniel',
      type: 'Consultation',
      date: '14 March',
    ),
  ];

  List<AppointmentData> _filtered(int selectedFilter) {
    if (selectedFilter == 0) return _appointments;
    return _appointments
        .where((a) => a.status == _filters[selectedFilter])
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: BlocBuilder<AppointmentBloc, AppointmentState>(
          builder: (context, state) {
            final filtered = _filtered(state.selectedFilter);
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),
                  const TopNavBar(),
                  const SizedBox(height: 24),
                  const SectionHeader(
                    title: 'Appointments',
                    subtitle: 'Manage all appointments',
                  ),
                  const SizedBox(height: 20),
                  _buildStatsRow(),
                  const SizedBox(height: 24),
                  FilterTabs(
                    labels: _filters,
                    selectedIndex: state.selectedFilter,
                    onTap: (i) => context
                        .read<AppointmentBloc>()
                        .add(AppointmentFilterChanged(i)),
                  ),
                  const SizedBox(height: 16),
                  ...filtered.map((a) => AppointmentCard(
                        name: a.name,
                        phone: a.phone,
                        initials: a.initials,
                        avatarColor: a.avatarColor,
                        status: a.status,
                        statusColor: a.statusColor,
                        doctor: a.doctor,
                        type: a.type,
                        date: a.date,
                      )),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(
          child: IconStatCard(
            value: '52',
            label: 'Total',
            change: '4%',
            icon: Icons.bar_chart_rounded,
            iconBgColor: const Color(0xFFEDE9FE),
            iconColor: AppColors.accent,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: IconStatCard(
            value: '28',
            label: 'Completed',
            change: '12',
            icon: Icons.check_circle_rounded,
            iconBgColor: const Color(0xFFE8F5E9),
            iconColor: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: IconStatCard(
            value: '18',
            label: 'Ongoing',
            change: '0',
            icon: Icons.access_time_rounded,
            iconBgColor: const Color(0xFFFFF3E0),
            iconColor: AppColors.orange,
            isSelected: true,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: IconStatCard(
            value: '6',
            label: 'Cancelled',
            change: '2',
            icon: Icons.cancel_rounded,
            iconBgColor: const Color(0xFFFFE0E0),
            iconColor: AppColors.red,
          ),
        ),
      ],
    );
  }
}

// ──────────── data class ────────────

class AppointmentData {
  final String name;
  final String phone;
  final String initials;
  final Color avatarColor;
  final String status;
  final Color statusColor;
  final String doctor;
  final String type;
  final String date;

  const AppointmentData({
    required this.name,
    required this.phone,
    required this.initials,
    required this.avatarColor,
    required this.status,
    required this.statusColor,
    required this.doctor,
    required this.type,
    required this.date,
  });
}
