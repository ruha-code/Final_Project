part of 'register_bloc.dart';

@immutable
sealed class RegisterEvent {}

final class RegisterPasswordVisibilityToggled extends RegisterEvent {}

final class RegisterConfirmVisibilityToggled extends RegisterEvent {}

final class RegisterTermsChanged extends RegisterEvent {
  final bool value;
  RegisterTermsChanged(this.value);
}
