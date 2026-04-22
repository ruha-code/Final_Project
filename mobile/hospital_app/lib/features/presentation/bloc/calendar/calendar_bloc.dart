import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'calendar_event.dart';
part 'calendar_state.dart';

class CalendarBloc extends Bloc<CalendarEvent, CalendarState> {
  CalendarBloc() : super(const CalendarState(selectedDay: 15)) {
    on<CalendarDaySelected>((event, emit) {
      emit(CalendarState(selectedDay: event.day));
    });
  }
}
