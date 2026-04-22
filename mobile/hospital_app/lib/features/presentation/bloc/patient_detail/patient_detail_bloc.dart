import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'patient_detail_event.dart';
part 'patient_detail_state.dart';

class PatientDetailBloc extends Bloc<PatientDetailEvent, PatientDetailState> {
  PatientDetailBloc() : super(const PatientDetailState(chartPeriod: 1)) {
    on<PatientDetailChartToggled>((event, emit) {
      emit(PatientDetailState(chartPeriod: event.period));
    });
  }
}
