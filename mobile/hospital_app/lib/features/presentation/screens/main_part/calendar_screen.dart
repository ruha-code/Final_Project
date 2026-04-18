import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  int _selectedDay = 15;
  static const _today = 18;
  static const _daysInMonth = 31;
  static const _startDay = 5; // March 2025 starts on Saturday (index 5 for Mon-start)

  static const _dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  static const _events = <int, List<_EventData>>{
    10: [_EventData(time: '09:00', title: 'Consultation - Daniel Wong', color: AppColors.primary)],
    11: [_EventData(time: '08:00', title: 'Surgery - Daniel Wong', color: Color(0xFFEF4444))],
    15: [
      _EventData(time: '10:00', title: 'Follow-up - Sara Malik', color: AppColors.primary),
      _EventData(time: '14:00', title: 'Staff Meeting', color: Color(0xFF3B82F6)),
    ],
    18: [_EventData(time: '09:30', title: 'New Patient Intake', color: Color(0xFFF59E0B))],
    22: [_EventData(time: '11:00', title: 'Board Review', color: Color(0xFF8B5CF6))],
  };

  @override
  Widget build(BuildContext context) {
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
                subtitle: 'Calendar',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'Calendar',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),

              // ── Calendar Grid ──
              _buildCalendarCard(),
              const SizedBox(height: 20),

              // ── Events ──
              _buildEventsSection(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCalendarCard() {
    // Build cells: empty slots + day numbers
    final cells = <int?>[];
    for (int i = 0; i < _startDay; i++) {
      cells.add(null);
    }
    for (int d = 1; d <= _daysInMonth; d++) {
      cells.add(d);
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        children: [
          // Month header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'March 2025',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17, color: AppColors.textPrimary),
              ),
              Row(
                children: [
                  _navCircle(Icons.chevron_left),
                  const SizedBox(width: 8),
                  _navCircle(Icons.chevron_right),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Day names
          Row(
            children: _dayNames.map((d) {
              return Expanded(
                child: Center(
                  child: Text(
                    d,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textTertiary),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),

          // Days grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
            ),
            itemCount: cells.length,
            itemBuilder: (context, i) {
              final day = cells[i];
              if (day == null) return const SizedBox();
              final isSelected = day == _selectedDay;
              final isToday = day == _today;
              final hasEvent = _events.containsKey(day);

              return GestureDetector(
                onTap: () => setState(() => _selectedDay = day),
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Text(
                        '$day',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected || isToday ? FontWeight.w700 : FontWeight.w400,
                          color: isSelected
                              ? Colors.white
                              : isToday
                                  ? AppColors.primary
                                  : AppColors.textPrimary,
                        ),
                      ),
                      if (hasEvent && !isSelected)
                        Positioned(
                          bottom: 4,
                          child: Container(
                            width: 4,
                            height: 4,
                            decoration: BoxDecoration(
                              color: isToday ? AppColors.primary : const Color(0xFFEF4444),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _navCircle(IconData icon) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: AppColors.bgGrey,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 16, color: AppColors.textSecondary),
    );
  }

  Widget _buildEventsSection() {
    final dayEvents = _events[_selectedDay];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$_selectedDay March — ${dayEvents != null ? '${dayEvents.length} event(s)' : 'No events'}',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 10),
        if (dayEvents != null)
          ...dayEvents.map((ev) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border(left: BorderSide(color: ev.color, width: 3)),
                  boxShadow: AppShadows.cardLight,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ev.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    Text(ev.time, style: const TextStyle(fontSize: 12, color: AppColors.textTertiary)),
                  ],
                ),
              ))
        else
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 30),
              child: Text('No scheduled events', style: TextStyle(fontSize: 13, color: AppColors.textTertiary)),
            ),
          ),
      ],
    );
  }
}

class _EventData {
  final String time;
  final String title;
  final Color color;
  const _EventData({required this.time, required this.title, required this.color});
}
