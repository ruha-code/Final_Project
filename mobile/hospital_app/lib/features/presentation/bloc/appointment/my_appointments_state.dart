part of 'my_appointments_bloc.dart';

enum MyAppointmentsStatus { initial, loaded, error }

@immutable
class MyAppointmentsState {
  final MyAppointmentsStatus status;
  final List<Appointment> appointments;
  final MyAppointmentsFilter filter;
  final String? errorMessage;

  const MyAppointmentsState({
    required this.status,
    required this.appointments,
    required this.filter,
    this.errorMessage,
  });

  const MyAppointmentsState.initial()
      : status = MyAppointmentsStatus.initial,
        appointments = const [],
        filter = MyAppointmentsFilter.upcoming,
        errorMessage = null;

  /// Список после фильтра.
  List<Appointment> get filtered {
    final now = DateTime.now();
    switch (filter) {
      case MyAppointmentsFilter.upcoming:
        return appointments
            .where((a) =>
                a.startsAt.isAfter(now) &&
                a.status != AppointmentStatus.cancelled)
            .toList()
          ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
      case MyAppointmentsFilter.past:
        return appointments
            .where((a) =>
                a.startsAt.isBefore(now) &&
                a.status != AppointmentStatus.cancelled)
            .toList();
      case MyAppointmentsFilter.cancelled:
        return appointments
            .where((a) => a.status == AppointmentStatus.cancelled)
            .toList();
      case MyAppointmentsFilter.all:
        return appointments;
    }
  }

  MyAppointmentsState copyWith({
    MyAppointmentsStatus? status,
    List<Appointment>? appointments,
    MyAppointmentsFilter? filter,
    String? errorMessage,
  }) {
    return MyAppointmentsState(
      status: status ?? this.status,
      appointments: appointments ?? this.appointments,
      filter: filter ?? this.filter,
      errorMessage: errorMessage,
    );
  }
}
