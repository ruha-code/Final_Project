part of 'login_bloc.dart';

enum LoginStatus { initial, loading, success, failure }

@immutable
class LoginState {
  final bool obscurePassword;
  final bool rememberMe;
  final LoginStatus status;
  final String? errorMessage;

  const LoginState({
    required this.obscurePassword,
    required this.rememberMe,
    required this.status,
    this.errorMessage,
  });

  const LoginState.initial()
      : obscurePassword = true,
        rememberMe = false,
        status = LoginStatus.initial,
        errorMessage = null;

  LoginState copyWith({
    bool? obscurePassword,
    bool? rememberMe,
    LoginStatus? status,
    String? errorMessage,
  }) {
    return LoginState(
      obscurePassword: obscurePassword ?? this.obscurePassword,
      rememberMe: rememberMe ?? this.rememberMe,
      status: status ?? this.status,
      errorMessage: errorMessage,
    );
  }
}
