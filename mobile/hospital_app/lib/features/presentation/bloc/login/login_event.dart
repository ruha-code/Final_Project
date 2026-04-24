part of 'login_bloc.dart';

@immutable
sealed class LoginEvent {
  const LoginEvent();
}

final class LoginPasswordVisibilityToggled extends LoginEvent {
  const LoginPasswordVisibilityToggled();
}

final class LoginRememberMeChanged extends LoginEvent {
  final bool value;
  const LoginRememberMeChanged(this.value);
}

final class LoginSubmitted extends LoginEvent {
  final String email;
  final String password;
  const LoginSubmitted({required this.email, required this.password});
}

final class LoginWithGoogleRequested extends LoginEvent {
  const LoginWithGoogleRequested();
}
