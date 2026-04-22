import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'doctor_detail_event.dart';
part 'doctor_detail_state.dart';

class DoctorDetailBloc extends Bloc<DoctorDetailEvent, DoctorDetailState> {
  DoctorDetailBloc() : super(const DoctorDetailState(chartPeriod: 1)) {
    on<DoctorDetailChartToggled>((event, emit) {
      emit(DoctorDetailState(chartPeriod: event.period));
    });
  }
}
