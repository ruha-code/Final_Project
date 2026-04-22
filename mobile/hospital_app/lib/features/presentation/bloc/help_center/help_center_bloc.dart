import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'help_center_event.dart';
part 'help_center_state.dart';

class HelpCenterBloc extends Bloc<HelpCenterEvent, HelpCenterState> {
  HelpCenterBloc() : super(const HelpCenterState()) {
    on<HelpCenterFaqToggled>((event, emit) {
      final isAlreadyOpen = state.openFaqIndex == event.index;
      emit(HelpCenterState(
        openFaqIndex: isAlreadyOpen ? null : event.index,
      ));
    });
  }
}
