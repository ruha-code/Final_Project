import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/appointment.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/patient/patient_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/stat_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AuthBloc b) => b.state.user);
    final fullName = user?.displayName?.trim() ?? '';
    final firstName = fullName.isNotEmpty
        ? fullName.split(RegExp(r'\s+')).first
        : (user?.email?.split('@').first ?? 'there');

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const TopNavBar(),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Dashboard',
                subtitle: 'Hello $firstName, welcome back!',
              ),
              const SizedBox(height: 20),
              const _StatsRow(),
              const SizedBox(height: 24),
              const _TodaysAppointmentsCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

/// Три счётчика, считаем из живых стейтов блоков. Без сетевых дозапросов:
/// Doctor/Patient блоки уже подписаны на коллекции, значит длина списка =
/// текущее количество.
class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    final patientsCount = context.select((PatientBloc b) => b.state.patients.length);
    final doctorsCount = context.select((DoctorBloc b) => b.state.doctors.length);
    final myUid = context.select((AuthBloc b) => b.state.user?.uid);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          StatCard(
            title: 'Total Patients',
            value: patientsCount.toString(),
            change: 'live count',
            accentColor: AppColors.primary,
          ),
          const SizedBox(width: 12),
          StatCard(
            title: 'Total Doctors',
            value: doctorsCount.toString(),
            change: 'live count',
            accentColor: AppColors.accent,
          ),
          const SizedBox(width: 12),
          // Today's appointments — собственный StreamBuilder, потому что
          // фильтр по дате считается на клиенте сложновато; берём из репо.
          if (myUid != null)
            StreamBuilder<List<Appointment>>(
              stream: context
                  .read<AppointmentRepository>()
                  .watchTodaysAppointmentsForDoctor(myUid),
              builder: (ctx, snap) {
                final n = snap.data?.length ?? 0;
                return StatCard(
                  title: "Today's appts",
                  value: n.toString(),
                  change: 'My patients',
                  accentColor: AppColors.pink,
                );
              },
            )
          else
            const StatCard(
              title: "Today's appts",
              value: '—',
              change: 'sign in to see',
              accentColor: AppColors.pink,
            ),
        ],
      ),
    );
  }
}

/// Список сегодняшних записей для текущего доктора. Если их нет — empty state.
class _TodaysAppointmentsCard extends StatelessWidget {
  const _TodaysAppointmentsCard();

  @override
  Widget build(BuildContext context) {
    final myUid = context.select((AuthBloc b) => b.state.user?.uid);
    if (myUid == null) return const SizedBox.shrink();

    return StreamBuilder<List<Appointment>>(
      stream: context
          .read<AppointmentRepository>()
          .watchTodaysAppointmentsForDoctor(myUid),
      builder: (ctx, snap) {
        final list = snap.data ?? const <Appointment>[];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: AppDecorations.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Today's appointments",
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              if (snap.connectionState == ConnectionState.waiting)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (list.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'No appointments today.',
                      style: TextStyle(
                          fontSize: 13, color: AppColors.textTertiary),
                    ),
                  ),
                )
              else
                ...list.map((a) => _AppointmentTile(appt: a)),
            ],
          ),
        );
      },
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  final Appointment appt;
  const _AppointmentTile({required this.appt});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 50,
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  _two(appt.startsAt.hour),
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary),
                ),
                Text(
                  _two(appt.startsAt.minute),
                  style: const TextStyle(
                      fontSize: 10, color: AppColors.primary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appt.patientName.isEmpty ? 'Unnamed patient' : appt.patientName,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                ),
                if (appt.reason.isNotEmpty)
                  Text(appt.reason,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textTertiary)),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: appt.status.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              appt.status.label,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: appt.status.color),
            ),
          ),
        ],
      ),
    );
  }

  String _two(int n) => n.toString().padLeft(2, '0');
}
