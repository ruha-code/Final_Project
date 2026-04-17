part of 'doctor_bloc.dart';

@immutable
sealed class DoctorEvent {}

final class DoctorFilterChanged extends DoctorEvent {
  final int filterIndex;
  DoctorFilterChanged(this.filterIndex);
}
