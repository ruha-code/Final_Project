part of 'patient_bloc.dart';

enum PatientStatus { initial, loaded, error }

@immutable
class PatientState {
  final PatientStatus status;
  final List<Patient> patients;
  final int selectedFilter;
  final String? errorMessage;

  const PatientState({
    required this.status,
    required this.patients,
    required this.selectedFilter,
    this.errorMessage,
  });

  const PatientState.initial()
      : status = PatientStatus.initial,
        patients = const [],
        selectedFilter = 0,
        errorMessage = null;

  PatientState copyWith({
    PatientStatus? status,
    List<Patient>? patients,
    int? selectedFilter,
    String? errorMessage,
  }) {
    return PatientState(
      status: status ?? this.status,
      patients: patients ?? this.patients,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      errorMessage: errorMessage,
    );
  }
}
