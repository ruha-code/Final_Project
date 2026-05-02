import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/appointment.dart';
import 'package:hospital_app/features/presentation/bloc/appointment/my_appointments_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/stat_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_booking_screen.dart';

/// Главный экран пациента — счётчики + ближайший приём + список upcoming.
/// Все данные — из MyAppointmentsBloc (он сам подписан на свои записи)
/// и DoctorBloc (для подсчёта доступных докторов).
class PatientDashboardScreen extends StatelessWidget {
  const PatientDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AuthBloc b) => b.state.user);
    final fullName = context.select((AuthBloc b) =>
        b.state.profile?.displayName.trim() ??
        b.state.user?.displayName?.trim() ??
        '');
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
              const TopNavBar(showSearch: false),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Dashboard',
                subtitle: 'Hello $firstName, welcome back!',
              ),
              const SizedBox(height: 20),
              const _StatsRow(),
              const SizedBox(height: 24),
              const _NextAppointmentCard(),
              const SizedBox(height: 16),
              const _UpcomingAppointmentsCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    final apptsTotal = context.select((MyAppointmentsBloc b) =>
        b.state.appointments
            .where((a) => a.status != AppointmentStatus.cancelled)
            .length);
    final upcomingCount = context.select((MyAppointmentsBloc b) {
      final now = DateTime.now();
      return b.state.appointments
          .where((a) =>
              a.startsAt.isAfter(now) &&
              a.status != AppointmentStatus.cancelled)
          .length;
    });
    final doctorsCount =
        context.select((DoctorBloc b) => b.state.doctors.length);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          StatCard(
            title: 'Upcoming',
            value: upcomingCount.toString(),
            change: 'Your next visits',
            accentColor: AppColors.primary,
          ),
          const SizedBox(width: 12),
          StatCard(
            title: 'Total appts',
            value: apptsTotal.toString(),
            change: 'All-time',
            accentColor: AppColors.accent,
          ),
          const SizedBox(width: 12),
          StatCard(
            title: 'Doctors',
            value: doctorsCount.toString(),
            change: 'Available',
            accentColor: AppColors.pink,
          ),
        ],
      ),
    );
  }
}

/// Большая карточка ближайшего приёма + кнопка "Book new", если ничего нет.
class _NextAppointmentCard extends StatelessWidget {
  const _NextAppointmentCard();

  Appointment? _findNext(List<Appointment> all) {
    final now = DateTime.now();
    final upcoming = all
        .where((a) =>
            a.startsAt.isAfter(now) &&
            a.status != AppointmentStatus.cancelled)
        .toList()
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return upcoming.isEmpty ? null : upcoming.first;
  }

  String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}';
  }

  String _fmtTime(DateTime d) =>
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final next = context.select<MyAppointmentsBloc, Appointment?>(
        (b) => _findNext(b.state.appointments));

    if (next == null) {
      // Пусто — приглашаем забронировать.
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)],
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('No appointments booked',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(
              'Schedule your first visit with a doctor.',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 13),
            ),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const PatientBookingScreen()),
              ),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Book appointment'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primary,
                elevation: 0,
              ),
            ),
          ],
        ),
      );
    }

    // Показываем ближайший приём.
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.event,
                  size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              const Text('Next appointment',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: next.status.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(next.status.label,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: next.status.color)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Text(_fmtDate(next.startsAt),
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary)),
                    const SizedBox(height: 2),
                    Text(_fmtTime(next.startsAt),
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.primary)),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      next.doctorName.isEmpty ? 'Doctor' : next.doctorName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary),
                    ),
                    if (next.reason.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(next.reason,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textTertiary)),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _UpcomingAppointmentsCard extends StatelessWidget {
  const _UpcomingAppointmentsCard();

  @override
  Widget build(BuildContext context) {
    final upcoming = context.select<MyAppointmentsBloc, List<Appointment>>(
      (b) {
        final now = DateTime.now();
        final list = b.state.appointments
            .where((a) =>
                a.startsAt.isAfter(now) &&
                a.status != AppointmentStatus.cancelled)
            .toList()
          ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
        // Первый — уже показан в _NextAppointmentCard, дальше идут эти.
        return list.length > 1 ? list.sublist(1) : const <Appointment>[];
      },
    );

    if (upcoming.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Other upcoming',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          ...upcoming.map((a) => _SmallApptTile(appt: a)),
        ],
      ),
    );
  }
}

class _SmallApptTile extends StatelessWidget {
  final Appointment appt;
  const _SmallApptTile({required this.appt});

  String _fmt(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          const Icon(Icons.access_time,
              size: 14, color: AppColors.textTertiary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appt.doctorName.isEmpty ? 'Doctor' : appt.doctorName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600),
                ),
                Text(
                  _fmt(appt.startsAt),
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textTertiary),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: appt.status.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              appt.status.label,
              style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: appt.status.color),
            ),
          ),
        ],
      ),
    );
  }
}
