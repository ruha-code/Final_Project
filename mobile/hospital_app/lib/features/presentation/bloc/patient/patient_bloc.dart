import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'patient_event.dart';
part 'patient_state.dart';

class PatientBloc extends Bloc<PatientEvent, PatientState> {
  PatientBloc() : super(const PatientState(selectedFilter: 0)) {
    on<PatientFilterChanged>((event, emit) {
      emit(PatientState(selectedFilter: event.filterIndex));
    });
  }
}
