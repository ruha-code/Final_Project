import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'doctor_event.dart';
part 'doctor_state.dart';

class DoctorBloc extends Bloc<DoctorEvent, DoctorState> {
  DoctorBloc() : super(const DoctorState(selectedFilter: 0)) {
    on<DoctorFilterChanged>((event, emit) {
      emit(DoctorState(selectedFilter: event.filterIndex));
    });
  }
}
