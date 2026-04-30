import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/appointment.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/presentation/bloc/appointment/my_appointments_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

/// Записи доктора. Фильтры: Upcoming / Past / Cancelled.
/// Действия: Confirm (если pending) и Cancel.
class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  static const _filters = ['Upcoming', 'Past', 'Cancelled'];

  static const _filterValues = [
    MyAppointmentsFilter.upcoming,
    MyAppointmentsFilter.past,
    MyAppointmentsFilter.cancelled,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: BlocBuilder<MyAppointmentsBloc, MyAppointmentsState>(
          builder: (context, state) {
            final filtered = state.filtered;
            final selectedIdx = _filterValues.indexOf(state.filter);

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
                    subtitle: 'Manage bookings with patients',
                  ),
                  const SizedBox(height: 16),
                  FilterTabs(
                    labels: _filters,
                    selectedIndex: selectedIdx >= 0 ? selectedIdx : 0,
                    onTap: (i) => context.read<MyAppointmentsBloc>().add(
                          MyAppointmentsFilterChanged(_filterValues[i]),
                        ),
                  ),
                  const SizedBox(height: 16),
                  _body(context, state, filtered),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _body(BuildContext context, MyAppointmentsState state,
      List<Appointment> filtered) {
    if (state.status == MyAppointmentsStatus.initial) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (state.status == MyAppointmentsStatus.error) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Text(
            state.errorMessage ?? 'Failed to load',
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }
    if (filtered.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(
          child: Text(
            'No appointments here.',
            style: TextStyle(color: AppColors.textTertiary, fontSize: 13),
          ),
        ),
      );
    }
    return Column(
      children: filtered
          .map((a) => _DoctorApptCard(appt: a))
          .toList(),
    );
  }
}

class _DoctorApptCard extends StatelessWidget {
  final Appointment appt;
  const _DoctorApptCard({required this.appt});

  String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${_two(d.hour)}:${_two(d.minute)}';
  }

  String _two(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final canConfirm = appt.status == AppointmentStatus.pending;
    final canCancel = appt.status == AppointmentStatus.pending ||
        appt.status == AppointmentStatus.confirmed;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  appt.patientName.isEmpty ? 'Unnamed' : appt.patientName,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
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
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.access_time,
                  size: 14, color: AppColors.textTertiary),
              const SizedBox(width: 6),
              Text(
                _fmtDate(appt.startsAt),
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(width: 12),
              Text(
                '${appt.durationMinutes} min',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textTertiary),
              ),
            ],
          ),
          if (appt.reason.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Reason: ${appt.reason}',
              style:
                  const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
          if (canConfirm || canCancel) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                if (canConfirm)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _confirm(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side:
                            const BorderSide(color: AppColors.primary),
                      ),
                      child: const Text('Confirm'),
                    ),
                  ),
                if (canConfirm && canCancel) const SizedBox(width: 8),
                if (canCancel)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _cancel(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.red,
                        side: const BorderSide(color: AppColors.red),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _confirm(BuildContext context) async {
    try {
      await context
          .read<AppointmentRepository>()
          .updateStatus(appt.id, AppointmentStatus.confirmed);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _cancel(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel appointment?'),
        content: Text(
            'Cancel appointment with ${appt.patientName}? The slot will be released.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('No')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Yes, cancel',
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<AppointmentRepository>().cancelAppointment(appt);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed: $e'), backgroundColor: Colors.red));
    }
  }
}
