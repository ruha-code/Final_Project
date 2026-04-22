part of 'doctor_detail_bloc.dart';

@immutable
class DoctorDetailState {
  final int chartPeriod; // 0 = Weekly, 1 = Monthly

  const DoctorDetailState({required this.chartPeriod});
}
