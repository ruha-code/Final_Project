import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/appointment.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/presentation/bloc/appointment/my_appointments_bloc.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_booking_screen.dart';

class PatientAppointmentsScreen extends StatelessWidget {
  const PatientAppointmentsScreen({super.key});

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
                  const SizedBox(height: 20),
                  const Text('My Appointments',
                      style: TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  const Text('Your bookings with doctors',
                      style: TextStyle(
                          fontSize: 13, color: AppColors.textTertiary)),
                  const SizedBox(height: 16),
                  FilterTabs(
                    labels: _filters,
                    selectedIndex: selectedIdx >= 0 ? selectedIdx : 0,
                    onTap: (i) => context.read<MyAppointmentsBloc>().add(
                          MyAppointmentsFilterChanged(_filterValues[i]),
                        ),
                  ),
                  const SizedBox(height: 16),
                  if (state.status == MyAppointmentsStatus.initial)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 60),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (filtered.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Column(
                          children: [
                            const Text(
                              'No appointments here.',
                              style: TextStyle(
                                  color: AppColors.textTertiary,
                                  fontSize: 13),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const PatientBookingScreen(),
                                ),
                              ),
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Book one'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                elevation: 0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ...filtered.map((a) => _PatientApptCard(appt: a)),
                  const SizedBox(height: 80),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'patient_book_fab',
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PatientBookingScreen()),
        ),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Book', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}

class _PatientApptCard extends StatelessWidget {
  final Appointment appt;
  const _PatientApptCard({required this.appt});

  String _fmt(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${_two(d.hour)}:${_two(d.minute)}';
  }

  String _two(int n) => n.toString().padLeft(2, '0');

  Future<void> _cancel(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel appointment?'),
        content: const Text(
            'Your booking will be cancelled and the slot freed.'),
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
        content: Text('Failed: $e'),
        backgroundColor: Colors.red,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  appt.doctorName.isEmpty ? 'Doctor' : appt.doctorName,
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
              Text(_fmt(appt.startsAt),
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
          if (appt.reason.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text('Reason: ${appt.reason}',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          ],
          if (canCancel) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
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
        ],
      ),
    );
  }
}
