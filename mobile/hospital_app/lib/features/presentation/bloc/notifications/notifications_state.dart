part of 'notifications_bloc.dart';

@immutable
class NotificationsState {
  final Map<String, bool> toggles;

  const NotificationsState({required this.toggles});

  factory NotificationsState.initial() => const NotificationsState(
        toggles: {
          'push': true,
          'email': true,
          'sms': false,
          'appointments': true,
          'messages': true,
          'updates': false,
          'alerts': true,
          'dnd': true,
        },
      );

  bool valueOf(String key) => toggles[key] ?? false;
}
