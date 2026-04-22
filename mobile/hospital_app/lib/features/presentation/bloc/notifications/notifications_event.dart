part of 'notifications_bloc.dart';

@immutable
sealed class NotificationsEvent {}

final class NotificationToggled extends NotificationsEvent {
  final String key;
  NotificationToggled(this.key);
}
