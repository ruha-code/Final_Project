import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'privacy_event.dart';
part 'privacy_state.dart';

class PrivacyBloc extends Bloc<PrivacyEvent, PrivacyState> {
  PrivacyBloc() : super(PrivacyState.initial()) {
    on<PrivacyToggled>((event, emit) {
      final updated = Map<String, bool>.from(state.toggles);
      updated[event.key] = !(updated[event.key] ?? false);
      emit(PrivacyState(toggles: updated));
    });
  }
}
