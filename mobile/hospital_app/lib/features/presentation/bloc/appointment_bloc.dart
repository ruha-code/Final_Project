import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'appointment_event.dart';
part 'appointment_state.dart';

class AppointmentBloc extends Bloc<AppointmentEvent, AppointmentState> {
  AppointmentBloc() : super(const AppointmentState(selectedFilter: 0)) {
    on<AppointmentFilterChanged>((event, emit) {
      emit(AppointmentState(selectedFilter: event.filterIndex));
    });
  }
}
