part of 'patient_bloc.dart';

@immutable
sealed class PatientEvent {}

final class PatientFilterChanged extends PatientEvent {
  final int filterIndex;
  PatientFilterChanged(this.filterIndex);
}
