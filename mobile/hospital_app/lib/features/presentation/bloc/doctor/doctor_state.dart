part of 'doctor_bloc.dart';

enum DoctorStatus { initial, loaded, error }

@immutable
class DoctorState {
  final DoctorStatus status;
  final List<Doctor> doctors;
  final int selectedFilter;
  final String? errorMessage;

  const DoctorState({
    required this.status,
    required this.doctors,
    required this.selectedFilter,
    this.errorMessage,
  });

  const DoctorState.initial()
      : status = DoctorStatus.initial,
        doctors = const [],
        selectedFilter = 0,
        errorMessage = null;

  DoctorState copyWith({
    DoctorStatus? status,
    List<Doctor>? doctors,
    int? selectedFilter,
    String? errorMessage,
  }) {
    return DoctorState(
      status: status ?? this.status,
      doctors: doctors ?? this.doctors,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      errorMessage: errorMessage,
    );
  }
}
