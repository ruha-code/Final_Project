part of 'patient_bloc.dart';

@immutable
sealed class PatientEvent {
  const PatientEvent();
}

final class PatientFilterChanged extends PatientEvent {
  final int filterIndex;
  const PatientFilterChanged(this.filterIndex);
}

final class _PatientListUpdated extends PatientEvent {
  final List<Patient> patients;
  const _PatientListUpdated(this.patients);
}

final class _PatientListFailed extends PatientEvent {
  final String message;
  const _PatientListFailed(this.message);
}
