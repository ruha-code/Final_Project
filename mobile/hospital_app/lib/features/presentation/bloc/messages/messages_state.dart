part of 'messages_bloc.dart';

@immutable
class MessagesState {
  final int? selectedChatId;

  const MessagesState({this.selectedChatId});

  bool get isInChat => selectedChatId != null;
}
