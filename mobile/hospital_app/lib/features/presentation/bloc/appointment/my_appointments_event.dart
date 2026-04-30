part of 'my_appointments_bloc.dart';

@immutable
sealed class MyAppointmentsEvent {
  const MyAppointmentsEvent();
}

enum MyAppointmentsFilter { upcoming, past, cancelled, all }

final class MyAppointmentsFilterChanged extends MyAppointmentsEvent {
  final MyAppointmentsFilter filter;
  const MyAppointmentsFilterChanged(this.filter);
}

final class _ListUpdated extends MyAppointmentsEvent {
  final List<Appointment> list;
  const _ListUpdated(this.list);
}

final class _ListFailed extends MyAppointmentsEvent {
  final String message;
  const _ListFailed(this.message);
}
