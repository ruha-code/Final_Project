part of 'register_bloc.dart';

@immutable
class RegisterState {
  final bool obscurePassword;
  final bool obscureConfirm;
  final bool agreeTerms;

  const RegisterState({
    required this.obscurePassword,
    required this.obscureConfirm,
    required this.agreeTerms,
  });
}
