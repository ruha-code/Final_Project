part of 'auth_bloc.dart';

enum AuthStatus {
  /// Ещё не определились: ждём первого эмита из authStateChanges.
  unknown,

  /// Пользователь залогинен — в [AuthState.user] лежит его Firebase User.
  authenticated,

  /// Пользователь не залогинен.
  unauthenticated,
}

@immutable
class AuthState {
  final AuthStatus status;
  final User? user;

  const AuthState._(this.status, this.user);

  const AuthState.unknown() : this._(AuthStatus.unknown, null);
  const AuthState.authenticated(User user)
      : this._(AuthStatus.authenticated, user);
  const AuthState.unauthenticated() : this._(AuthStatus.unauthenticated, null);
}
