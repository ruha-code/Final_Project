import 'package:bloc/bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:meta/meta.dart';

part 'login_event.dart';
part 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  LoginBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(const LoginState.initial()) {
    on<LoginPasswordVisibilityToggled>((e, emit) =>
        emit(state.copyWith(obscurePassword: !state.obscurePassword)));
    on<LoginRememberMeChanged>(
        (e, emit) => emit(state.copyWith(rememberMe: e.value)));
    on<LoginSubmitted>(_onSubmitted);
  }

  final AuthRepository _authRepository;

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
