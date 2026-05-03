import 'package:bloc/bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:meta/meta.dart';

part 'login_event.dart';
part 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  LoginBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        _storage = const FlutterSecureStorage(),
        super(const LoginState.initial()) {
    on<LoginPasswordVisibilityToggled>((e, emit) =>
        emit(state.copyWith(obscurePassword: !state.obscurePassword)));
    on<LoginRememberMeChanged>(
        (e, emit) => emit(state.copyWith(rememberMe: e.value)));
    on<LoginCredentialsLoadRequested>(_onLoadCredentials);
    on<LoginSubmitted>(_onSubmitted);
  }

  final AuthRepository _authRepository;
  final FlutterSecureStorage _storage;

  static const _keyEmail = 'saved_email';
  static const _keyPassword = 'saved_password';
  static const _keyRemember = 'remember_me';

  Future<void> _onLoadCredentials(
      LoginCredentialsLoadRequested event, Emitter<LoginState> emit) async {
    final remember = await _storage.read(key: _keyRemember);
    if (remember != 'true') return;

    final email = await _storage.read(key: _keyEmail) ?? '';
    final password = await _storage.read(key: _keyPassword) ?? '';

    emit(state.copyWith(
      rememberMe: true,
      savedEmail: email,
      savedPassword: password,
    ));
  }

  Future<void> _onSubmitted(
      LoginSubmitted event, Emitter<LoginState> emit) async {
    if (event.email.trim().isEmpty || event.password.isEmpty) {
      emit(state.copyWith(
        status: LoginStatus.failure,
        errorMessage: 'Enter both email and password',
      ));
      return;
    }
    emit(state.copyWith(status: LoginStatus.loading));
    try {
      await _authRepository.signInWithEmail(
          email: event.email, password: event.password);

      if (state.rememberMe) {
        await _storage.write(key: _keyEmail, value: event.email.trim());
        await _storage.write(key: _keyPassword, value: event.password);
        await _storage.write(key: _keyRemember, value: 'true');
      } else {
        await _storage.delete(key: _keyEmail);
        await _storage.delete(key: _keyPassword);
        await _storage.delete(key: _keyRemember);
      }

      emit(state.copyWith(status: LoginStatus.success));
    } on FirebaseAuthException catch (e) {
      emit(state.copyWith(
          status: LoginStatus.failure, errorMessage: _mapAuthError(e)));
    } catch (_) {
      emit(state.copyWith(
          status: LoginStatus.failure,
          errorMessage: 'Something went wrong. Try again.'));
    }
  }

  String _mapAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Wrong email or password';
      case 'invalid-email':
        return 'Invalid email format';
      case 'user-disabled':
        return 'This account has been disabled';
      case 'too-many-requests':
        return 'Too many attempts. Try again later.';
      case 'network-request-failed':
        return 'No internet connection';
      default:
        return e.message ?? 'Authentication failed';
    }
  }
}