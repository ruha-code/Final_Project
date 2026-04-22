part of 'patient_detail_bloc.dart';

@immutable
class PatientDetailState {
  final int chartPeriod; // 0 = Weekly, 1 = Monthly

  const PatientDetailState({required this.chartPeriod});
}
