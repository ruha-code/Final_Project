part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {
  const AuthEvent();
}

/// Внутреннее событие от подписки на [AuthRepository.user].
final class AuthUserChanged extends AuthEvent {
  final User? user;
  const AuthUserChanged(this.user);
}

/// Событие от UI (кнопка Logout).
final class AuthSignOutRequested extends AuthEvent {
  const AuthSignOutRequested();
}
