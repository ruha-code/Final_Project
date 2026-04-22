part of 'doctor_detail_bloc.dart';

@immutable
sealed class DoctorDetailEvent {}

final class DoctorDetailChartToggled extends DoctorDetailEvent {
  final int period; // 0 = Weekly, 1 = Monthly
  DoctorDetailChartToggled(this.period);
}
