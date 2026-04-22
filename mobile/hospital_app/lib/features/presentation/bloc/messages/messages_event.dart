part of 'messages_bloc.dart';

@immutable
sealed class MessagesEvent {}

final class MessagesChatOpened extends MessagesEvent {
  final int chatId;
  MessagesChatOpened(this.chatId);
}

final class MessagesChatClosed extends MessagesEvent {}
