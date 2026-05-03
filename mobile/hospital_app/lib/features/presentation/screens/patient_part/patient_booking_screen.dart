import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/availability_slot.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/data/services/notification_service.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

/// Точка входа: если doctor==null — список докторов, иначе календарь.
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
                    style: const TextStyle(fontWeight: FontWeight.w600)),
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

/// Календарная сетка месяца + список слотов выбранного дня.
class _SlotsView extends StatefulWidget {
  final Doctor doctor;
  const _SlotsView({required this.doctor});

  @override
  State<_SlotsView> createState() => _SlotsViewState();
}

class _SlotsViewState extends State<_SlotsView> {
  late DateTime _visibleMonth;
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _visibleMonth = DateTime(now.year, now.month, 1);
    // По умолчанию выделяем сегодня — не обязательно есть слоты, но юзер
    // сразу видит сегодняшний день в фокусе.
    _selectedDay = DateTime(now.year, now.month, now.day);
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  List<AvailabilitySlot> _slotsForSelectedDay(List<AvailabilitySlot> all) {
    if (_selectedDay == null) return const [];
    return all.where((s) => _sameDay(s.startsAt, _selectedDay!)).toList()
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
  }

  Set<DateTime> _daysWithSlots(List<AvailabilitySlot> all) {
    return all
        .map((s) => DateTime(s.startsAt.year, s.startsAt.month, s.startsAt.day))
        .toSet();
  }

  void _prevMonth() {
    setState(() {
      _visibleMonth =
          DateTime(_visibleMonth.year, _visibleMonth.month - 1, 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _visibleMonth =
          DateTime(_visibleMonth.year, _visibleMonth.month + 1, 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('Book with ${widget.doctor.name}',
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: StreamBuilder<List<AvailabilitySlot>>(
        stream: context
            .read<AppointmentRepository>()
            .watchAvailableSlots(widget.doctor.id),
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
              ),
            );
          }
          final allSlots = snap.data ?? const <AvailabilitySlot>[];
          final markedDays = _daysWithSlots(allSlots);
          final daySlots = _slotsForSelectedDay(allSlots);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _MonthHeader(
                month: _visibleMonth,
                onPrev: _prevMonth,
                onNext: _nextMonth,
              ),
              const SizedBox(height: 12),
              _CalendarGrid(
                month: _visibleMonth,
                markedDays: markedDays,
                selected: _selectedDay,
                onTap: (d) => setState(() => _selectedDay = d),
              ),
              const SizedBox(height: 24),
              if (allSlots.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'This doctor has no available slots yet.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textTertiary),
                    ),
                  ),
                )
              else if (_selectedDay == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text('Tap a day to see available times.',
                        style: TextStyle(color: AppColors.textTertiary)),
                  ),
                )
              else if (daySlots.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'No slots on ${_fmtDate(_selectedDay!)}.',
                      style: const TextStyle(color: AppColors.textTertiary),
                    ),
                  ),
                )
              else ...[
                Text(
                  _fmtDate(_selectedDay!),
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary),
                ),
                const SizedBox(height: 10),
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
              const SizedBox(height: 24),
            ],
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
      // Уведомление "Booked" + напоминание за 30 мин до приёма.
      // Если флаг notifications=false — сервис сам молча скипнет.
      // appointmentId на этом этапе уже создан; стрим перехватит его,
      // но для напоминания нам нужен id СРАЗУ — используем stable
      // hash из (uid + startsAt) как ключ, чтобы при отмене снять.
      final apptKey = '${patientUid}_${slot.startsAt.millisecondsSinceEpoch}';
      NotificationService.instance.showBookingConfirmed(
        uid: patientUid,
        doctorName: widget.doctor.name,
        when: slot.startsAt,
      );
      NotificationService.instance.scheduleAppointmentReminder(
        uid: patientUid,
        appointmentId: apptKey,
        doctorName: widget.doctor.name,
        startsAt: slot.startsAt,
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

class _MonthHeader extends StatelessWidget {
  final DateTime month;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  const _MonthHeader({
    required this.month,
    required this.onPrev,
    required this.onNext,
  });

  static const _names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left, color: AppColors.textPrimary),
          onPressed: onPrev,
        ),
        Text('${_names[month.month - 1]} ${month.year}',
            style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
        IconButton(
          icon: const Icon(Icons.chevron_right, color: AppColors.textPrimary),
          onPressed: onNext,
        ),
      ],
    );
  }
}

class _CalendarGrid extends StatelessWidget {
  final DateTime month;
  final Set<DateTime> markedDays;
  final DateTime? selected;
  final ValueChanged<DateTime> onTap;

  const _CalendarGrid({
    required this.month,
    required this.markedDays,
    required this.selected,
    required this.onTap,
  });

  static const _weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    final firstWeekday = (month.weekday - 1) % 7;
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final today = DateTime.now();

    final cells = <Widget>[];
    for (int i = 0; i < 42; i++) {
      final dayNum = i - firstWeekday + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.add(const SizedBox());
        continue;
      }
      final date = DateTime(month.year, month.month, dayNum);
      final isMarked = markedDays.any((d) => _sameDay(d, date));
      final isSelected = selected != null && _sameDay(selected!, date);
      final isToday = _sameDay(today, date);
      final isPast =
          date.isBefore(DateTime(today.year, today.month, today.day));
      final isWeekend = date.weekday >= DateTime.saturday;

      cells.add(_DayCell(
        day: dayNum,
        isMarked: isMarked,
        isSelected: isSelected,
        isToday: isToday,
        isPast: isPast,
        isWeekend: isWeekend,
        onTap: (isPast) ? null : () => onTap(date),
      ));
    }

    return Column(
      children: [
        Row(
          children: _weekdayLabels
              .map((l) => Expanded(
                    child: Center(
                      child: Text(
                        l,
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textTertiary),
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 8),
        for (int row = 0; row < 6; row++)
          Row(
            children: [
              for (int col = 0; col < 7; col++)
                Expanded(child: cells[row * 7 + col]),
            ],
          ),
      ],
    );
  }
}

class _DayCell extends StatelessWidget {
  final int day;
  final bool isMarked;
  final bool isSelected;
  final bool isToday;
  final bool isPast;
  final bool isWeekend;
  final VoidCallback? onTap;

  const _DayCell({
    required this.day,
    required this.isMarked,
    required this.isSelected,
    required this.isToday,
    required this.isPast,
    required this.isWeekend,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color textColor;
    if (isPast) {
      textColor = AppColors.textTertiary.withValues(alpha: 0.5);
    } else if (isWeekend && !isMarked) {
      // Выходные без слотов — приглушённые, чтобы пациент не тыкал зря.
      textColor = AppColors.textTertiary.withValues(alpha: 0.6);
    } else if (isSelected) {
      textColor = Colors.white;
    } else {
      textColor = AppColors.textPrimary;
    }

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 44,
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: !isSelected && isToday
              ? Border.all(color: AppColors.primary, width: 1.5)
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('$day',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: textColor)),
            const SizedBox(height: 2),
            if (isMarked && !isPast)
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white : AppColors.primary,
                  shape: BoxShape.circle,
                ),
              )
            else
              const SizedBox(height: 5),
          ],
        ),
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
