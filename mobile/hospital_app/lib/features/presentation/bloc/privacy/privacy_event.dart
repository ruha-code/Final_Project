part of 'privacy_bloc.dart';

@immutable
sealed class PrivacyEvent {}

final class PrivacyToggled extends PrivacyEvent {
  final String key;
  PrivacyToggled(this.key);
}
