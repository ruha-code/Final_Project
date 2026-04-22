part of 'login_bloc.dart';

@immutable
class LoginState {
  final bool obscurePassword;
  final bool rememberMe;

  const LoginState({
    required this.obscurePassword,
    required this.rememberMe,
  });
}
