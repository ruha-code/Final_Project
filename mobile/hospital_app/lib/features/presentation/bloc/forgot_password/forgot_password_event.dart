// forgot_password_event.dart
part of 'forgot_password_bloc.dart';

abstract class ForgotPasswordEvent {}

class ForgotPasswordSubmitted extends ForgotPasswordEvent {
  final String email;
  ForgotPasswordSubmitted(this.email);
}