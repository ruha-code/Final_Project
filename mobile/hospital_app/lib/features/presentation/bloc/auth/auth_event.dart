part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {
  const AuthEvent();
}

final class AuthUserChanged extends AuthEvent {
  final User? user;
  const AuthUserChanged(this.user);
}

final class AuthProfileChanged extends AuthEvent {
  final UserProfile? profile;
  const AuthProfileChanged(this.profile);
}

final class AuthSignOutRequested extends AuthEvent {
  const AuthSignOutRequested();
}
