import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'notifications_event.dart';
part 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  NotificationsBloc() : super(NotificationsState.initial()) {
    on<NotificationToggled>((event, emit) {
      final updated = Map<String, bool>.from(state.toggles);
      updated[event.key] = !(updated[event.key] ?? false);
      emit(NotificationsState(toggles: updated));
    });
  }
}
