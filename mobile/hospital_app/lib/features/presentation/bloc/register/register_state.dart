part of 'register_bloc.dart';

enum RegisterStatus { initial, loading, success, failure }

@immutable
class RegisterState {
  final bool obscurePassword;
  final bool obscureConfirm;
  final bool agreeTerms;
  final UserRole role;
  final RegisterStatus status;
  final String? errorMessage;

  const RegisterState({
    required this.obscurePassword,
    required this.obscureConfirm,
    required this.agreeTerms,
    required this.role,
    required this.status,
    this.errorMessage,
  });

  const RegisterState.initial()
      : obscurePassword = true,
        obscureConfirm = true,
        agreeTerms = false,
        role = UserRole.unknown,
        status = RegisterStatus.initial,
        errorMessage = null;

  RegisterState copyWith({
    bool? obscurePassword,
    bool? obscureConfirm,
    bool? agreeTerms,
    UserRole? role,
    RegisterStatus? status,
    String? errorMessage,
  }) {
    return RegisterState(
      obscurePassword: obscurePassword ?? this.obscurePassword,
      obscureConfirm: obscureConfirm ?? this.obscureConfirm,
      agreeTerms: agreeTerms ?? this.agreeTerms,
      role: role ?? this.role,
      status: status ?? this.status,
      errorMessage: errorMessage,
    );
  }
}
