part of 'patient_detail_bloc.dart';

@immutable
sealed class PatientDetailEvent {}

final class PatientDetailChartToggled extends PatientDetailEvent {
  final int period; // 0 = Weekly, 1 = Monthly
  PatientDetailChartToggled(this.period);
}
