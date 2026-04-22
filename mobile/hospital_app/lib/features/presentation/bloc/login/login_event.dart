part of 'login_bloc.dart';

@immutable
sealed class LoginEvent {}

final class LoginPasswordVisibilityToggled extends LoginEvent {}

final class LoginRememberMeChanged extends LoginEvent {
  final bool value;
  LoginRememberMeChanged(this.value);
}
