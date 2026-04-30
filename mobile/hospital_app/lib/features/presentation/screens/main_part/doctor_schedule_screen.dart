import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/availability_slot.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

/// Расписание доктора — список будущих слотов и кнопка добавить новый.
/// Если слот забронирован — показывается имя пациента, удалить нельзя.
class DoctorScheduleScreen extends StatelessWidget {
  const DoctorScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final uid = authState.user?.uid;
    final doctorName = authState.profile?.displayName ?? '';

    if (uid == null) {
      return const Scaffold(body: Center(child: Text('Not signed in')));
    }

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
                subtitle: 'My schedule',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'My Schedule',
                style:
                    TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              const Text(
                'Add time slots when patients can book',
                style: TextStyle(
                    fontSize: 13, color: AppColors.textTertiary),
              ),
              const SizedBox(height: 16),
              StreamBuilder<List<AvailabilitySlot>>(
                stream: context
                    .read<AppointmentRepository>()
                    .watchSlotsForDoctor(uid),
                builder: (ctx, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  final slots = snap.data ?? const <AvailabilitySlot>[];
                  if (slots.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Text(
                          'No slots yet. Tap + to add one.',
                          style: TextStyle(
                              color: AppColors.textTertiary, fontSize: 13),
                        ),
                      ),
                    );
                  }
                  return Column(
                    children: slots
                        .map((s) => _SlotTile(slot: s))
                        .toList(),
                  );
                },
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'schedule_fab',
        onPressed: () => _addSlot(context, uid, doctorName),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add slot',
            style: TextStyle(color: Colors.white)),
      ),
    );
  }

  /// Диалог добавления слота: выбор даты, времени, длительности.
  Future<void> _addSlot(
      BuildContext context, String uid, String doctorName) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 90)),
    );
    if (date == null || !context.mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
    );
    if (time == null || !context.mounted) return;

    final startsAt = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    if (startsAt.isBefore(DateTime.now())) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Cannot create a slot in the past'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    try {
      await context.read<AppointmentRepository>().addSlot(
            AvailabilitySlot(
              id: '',
              doctorUid: uid,
              doctorName: doctorName,
              startsAt: startsAt,
              durationMinutes: 30,
              isBooked: false,
            ),
          );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Slot added'),
      ));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Failed: $e'),
        backgroundColor: Colors.red,
      ));
    }
  }
}

class _SlotTile extends StatelessWidget {
  final AvailabilitySlot slot;
  const _SlotTile({required this.slot});

  String _fmt(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${_two(d.hour)}:${_two(d.minute)}';
  }

  String _two(int n) => n.toString().padLeft(2, '0');

  Future<void> _delete(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete slot?'),
        content: const Text('This empty slot will be removed.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete',
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<AppointmentRepository>().deleteSlot(slot.id);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed: $e'), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AppDecorations.card,
      child: Row(
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: slot.isBooked
                  ? AppColors.orange.withValues(alpha: 0.12)
                  : AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              slot.isBooked
                  ? Icons.event_busy
                  : Icons.event_available,
              size: 20,
              color: slot.isBooked ? AppColors.orange : AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _fmt(slot.startsAt),
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  slot.isBooked
                      ? 'Booked by ${slot.bookedByName ?? "patient"}'
                      : '${slot.durationMinutes} min · Free',
                  style: TextStyle(
                    fontSize: 12,
                    color: slot.isBooked
                        ? AppColors.orange
                        : AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          if (!slot.isBooked)
            IconButton(
              icon: const Icon(Icons.delete_outline,
                  color: AppColors.red, size: 20),
              onPressed: () => _delete(context),
            ),
        ],
      ),
    );
  }
}
