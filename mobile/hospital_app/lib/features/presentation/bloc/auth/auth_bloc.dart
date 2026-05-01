import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:meta/meta.dart';

part 'auth_event.dart';
part 'auth_state.dart';

/// Глобальный auth-стейт.
///
/// Слушает два стрима:
///  1. FirebaseAuth.userChanges — кто залогинен
///  2. users/{uid} в Firestore — какая роль (только когда есть user)
///
/// Стейт говорит: unknown / unauthenticated / authenticatedNoProfile
/// (юзер есть, но профиль ещё грузится) / authenticated (юзер + профиль).
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(const AuthState.unknown()) {
    on<AuthUserChanged>(_onUserChanged);
    on<AuthProfileChanged>(_onProfileChanged);
    on<AuthSignOutRequested>(_onSignOutRequested);

    _userSubscription = _authRepository.user.listen(
      (user) => add(AuthUserChanged(user)),
    );
  }

  final AuthRepository _authRepository;
  late final StreamSubscription<User?> _userSubscription;
  StreamSubscription<UserProfile?>? _profileSubscription;
  Timer? _profileTimeoutTimer;
  String? _currentProfileUid;

  Future<void> _onUserChanged(
      AuthUserChanged event, Emitter<AuthState> emit) async {
    final user = event.user;

    if (user == null) {
      // Логаут — закрываем подписку на профиль и сбрасываем стейт.
      await _profileSubscription?.cancel();
      _profileSubscription = null;
      _profileTimeoutTimer?.cancel();
      _profileTimeoutTimer = null;
      _currentProfileUid = null;
      emit(const AuthState.unauthenticated());
      return;
    }

    // Уже подписаны на профиль этого uid — обновляем только User
    // (profile прилетит сам через свой стрим).
    if (_currentProfileUid == user.uid) {
      emit(state.copyWith(user: user));
      return;
    }

    // Новый юзер — переподписываемся.
    await _profileSubscription?.cancel();
    _profileTimeoutTimer?.cancel();
    _currentProfileUid = user.uid;
    emit(AuthState(
      status: AuthStatus.authenticatedNoProfile,
      user: user,
      profile: null,
    ));
    _profileSubscription = _authRepository
        .watchUserProfile(user.uid)
        .listen((profile) => add(AuthProfileChanged(profile)));

    // Защита от бесконечного сплэша: если за 3с профиль не пришёл
    // (документа users/{uid} нет, либо доступ запрещён) — считаем,
    // что профиля нет, и показываем "Profile not found".
    _profileTimeoutTimer = Timer(const Duration(seconds: 3), () {
      if (state.status == AuthStatus.authenticatedNoProfile &&
          state.profile == null) {
        add(const AuthProfileChanged(null));
      }
    });
  }

  void _onProfileChanged(
      AuthProfileChanged event, Emitter<AuthState> emit) {
    if (state.user == null) return; // юзер вышел, игнорируем

    final user = state.user!;
    final profile = event.profile;

    // Если email НЕ подтверждён — отправляем юзера на отдельный экран
    // верификации, независимо от того, есть профиль или нет. Это валидно
    // только для пациентов: docter-аккаунты заводятся вручную в Firebase
    // Console и считаются доверенными — для них пропускаем проверку.
    final isPatient = profile?.role.asString == 'patient';
    if (isPatient && !user.emailVerified) {
      emit(AuthState(
        status: AuthStatus.emailNotVerified,
        user: user,
        profile: profile,
      ));
      return;
    }

    // Профиль пришёл (или подтверждено что его нет — null после таймаута).
    // В обоих случаях двигаемся в authenticated; роль внутри определяет UI:
    // valid role → нормальный экран, role.unknown → Profile not found.
    emit(AuthState(
      status: AuthStatus.authenticated,
      user: user,
      profile: profile,
    ));
  }

  Future<void> _onSignOutRequested(
      AuthSignOutRequested event, Emitter<AuthState> emit) async {
    await _authRepository.signOut();
  }

  @override
  Future<void> close() {
    _userSubscription.cancel();
    _profileSubscription?.cancel();
    _profileTimeoutTimer?.cancel();
    return super.close();
  }
}