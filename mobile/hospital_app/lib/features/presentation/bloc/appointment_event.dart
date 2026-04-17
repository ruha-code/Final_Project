part of 'appointment_bloc.dart';

@immutable
sealed class AppointmentEvent {}

final class AppointmentFilterChanged extends AppointmentEvent {
  final int filterIndex;
  AppointmentFilterChanged(this.filterIndex);
}
