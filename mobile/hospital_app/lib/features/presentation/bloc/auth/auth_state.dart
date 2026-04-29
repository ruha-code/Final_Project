part of 'auth_bloc.dart';

enum AuthStatus {
  /// Ждём первого ответа от Firebase Auth.
  unknown,

  /// Не залогинен.
  unauthenticated,

  /// User залогинен, но профиль из Firestore ещё не подгружен.
  /// Показывать сплэш в этом состоянии.
  authenticatedNoProfile,

  /// User + профиль готовы — можно показывать UI по роли.
  authenticated,
}

@immutable
class AuthState {
  final AuthStatus status;
  final User? user;
  final UserProfile? profile;

  const AuthState({
    required this.status,
    required this.user,
    required this.profile,
  });

  const AuthState.unknown()
      : status = AuthStatus.unknown,
        user = null,
        profile = null;

  const AuthState.unauthenticated()
      : status = AuthStatus.unauthenticated,
        user = null,
        profile = null;

  /// Удобный геттер: текущая роль или unknown.
  UserRole get role => profile?.role ?? UserRole.unknown;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    UserProfile? profile,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      profile: profile ?? this.profile,
    );
  }
}
