part of 'register_bloc.dart';

@immutable
sealed class RegisterEvent {
  const RegisterEvent();
}

final class RegisterPasswordVisibilityToggled extends RegisterEvent {
  const RegisterPasswordVisibilityToggled();
}

final class RegisterConfirmVisibilityToggled extends RegisterEvent {
  const RegisterConfirmVisibilityToggled();
}

final class RegisterTermsChanged extends RegisterEvent {
  final bool value;
  const RegisterTermsChanged(this.value);
}

final class RegisterSubmitted extends RegisterEvent {
  final String displayName;
  final String email;
  final String password;
  final String confirmPassword;

  const RegisterSubmitted({
    required this.displayName,
    required this.email,
    required this.password,
    required this.confirmPassword,
  });
}

final class RegisterWithGoogleRequested extends RegisterEvent {
  const RegisterWithGoogleRequested();
}
