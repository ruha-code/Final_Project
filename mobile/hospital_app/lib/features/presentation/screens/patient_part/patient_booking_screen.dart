import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/availability_slot.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

/// Двухуровневый экран:
///   1) если doctor == null — показать список докторов, выбрать → перейти к слотам
///   2) если doctor != null — показать его свободные слоты, можно забронировать
class PatientBookingScreen extends StatelessWidget {
  final Doctor? doctor;
  const PatientBookingScreen({super.key, this.doctor});

  @override
  Widget build(BuildContext context) {
    if (doctor == null) {
      return const _DoctorPicker();
    }
    return _SlotsView(doctor: doctor!);
  }
}

/// Шаг 1 — выбор доктора.
class _DoctorPicker extends StatelessWidget {
  const _DoctorPicker();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Book Appointment',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: BlocBuilder<DoctorBloc, DoctorState>(
        builder: (context, state) {
          if (state.status == DoctorStatus.initial) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.doctors.isEmpty) {
            return const Center(
              child: Text('No doctors available',
                  style: TextStyle(color: AppColors.textTertiary)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: state.doctors.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) {
              final d = state.doctors[i];
              return ListTile(
                tileColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppColors.border),
                ),
                leading: CircleAvatar(
                  backgroundColor: d.avatarColor,
                  child: Text(d.initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700)),
                ),
                title: Text(d.name,
                    style:
                        const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('${d.specialty} · ${d.schedule}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  ctx,
                  MaterialPageRoute(
                    builder: (_) => PatientBookingScreen(doctor: d),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Шаг 2 — список свободных слотов конкретного доктора.
class _SlotsView extends StatelessWidget {
  final Doctor doctor;
  const _SlotsView({required this.doctor});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('Book with ${doctor.name}',
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: StreamBuilder<List<AvailabilitySlot>>(
        stream: context
            .read<AppointmentRepository>()
            .watchAvailableSlots(doctor.id),
        builder: (ctx, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(
                child: Padding(
              padding: const EdgeInsets.all(20),
              child: Text('Error: ${snap.error}',
                  textAlign: TextAlign.center),
            ));
          }
          final slots = snap.data ?? const <AvailabilitySlot>[];
          if (slots.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No available slots. Check back later.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textTertiary),
                ),
              ),
            );
          }

          // Группировка по дате для удобства.
          final grouped = <String, List<AvailabilitySlot>>{};
          for (final s in slots) {
            final key =
                '${s.startsAt.year}-${s.startsAt.month}-${s.startsAt.day}';
            grouped.putIfAbsent(key, () => []).add(s);
          }
          final dateKeys = grouped.keys.toList();

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: dateKeys.length,
            itemBuilder: (ctx, i) {
              final key = dateKeys[i];
              final daySlots = grouped[key]!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (i > 0) const SizedBox(height: 16),
                  Text(
                    _fmtDate(daySlots.first.startsAt),
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: daySlots
                        .map((s) => _SlotChip(
                              slot: s,
                              onTap: () => _book(context, s),
                            ))
                        .toList(),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }

  String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${weekdays[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }

  Future<void> _book(BuildContext context, AvailabilitySlot slot) async {
    final auth = context.read<AuthBloc>().state;
    final patientUid = auth.user?.uid;
    final patientName = auth.profile?.displayName.isNotEmpty == true
        ? auth.profile!.displayName
        : (auth.user?.email ?? 'Patient');
    if (patientUid == null) return;

    final reason = await _askReason(context);
    if (reason == null || !context.mounted) return;

    try {
      await context.read<AppointmentRepository>().bookSlot(
            slot: slot,
            patientUid: patientUid,
            patientName: patientName,
            reason: reason,
          );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Booked! Waiting for doctor confirmation.'),
      ));
      Navigator.pop(context);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Failed: $e'),
        backgroundColor: Colors.red,
      ));
    }
  }

  Future<String?> _askReason(BuildContext context) async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reason for visit'),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'e.g. Routine check-up',
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('Book'),
          ),
        ],
      ),
    );
  }
}

class _SlotChip extends StatelessWidget {
  final AvailabilitySlot slot;
  final VoidCallback onTap;
  const _SlotChip({required this.slot, required this.onTap});

  String _two(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3)),
        ),
        child: Text(
          '${_two(slot.startsAt.hour)}:${_two(slot.startsAt.minute)}',
          style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.primary),
        ),
      ),
    );
  }
}
