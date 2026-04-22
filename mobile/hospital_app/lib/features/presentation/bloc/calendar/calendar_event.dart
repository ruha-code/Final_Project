part of 'calendar_bloc.dart';

@immutable
sealed class CalendarEvent {}

final class CalendarDaySelected extends CalendarEvent {
  final int day;
  CalendarDaySelected(this.day);
}
