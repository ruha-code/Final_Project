import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'messages_event.dart';
part 'messages_state.dart';

class MessagesBloc extends Bloc<MessagesEvent, MessagesState> {
  MessagesBloc() : super(const MessagesState()) {
    on<MessagesChatOpened>((event, emit) {
      emit(MessagesState(selectedChatId: event.chatId));
    });
    on<MessagesChatClosed>((event, emit) {
      emit(const MessagesState());
    });
  }
}
