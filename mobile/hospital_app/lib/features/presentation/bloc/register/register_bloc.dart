import 'package:bloc/bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:meta/meta.dart';

part 'register_event.dart';
part 'register_state.dart';

class RegisterBloc extends Bloc<RegisterEvent, RegisterState> {
  RegisterBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(const RegisterState.initial()) {
    on<RegisterPasswordVisibilityToggled>((e, emit) =>
        emit(state.copyWith(obscurePassword: !state.obscurePassword)));
    on<RegisterConfirmVisibilityToggled>((e, emit) =>
        emit(state.copyWith(obscureConfirm: !state.obscureConfirm)));
    on<RegisterTermsChanged>(
        (e, emit) => emit(state.copyWith(agreeTerms: e.value)));
    on<RegisterSubmitted>(_onSubmitted);
    on<RegisterWithGoogleRequested>(_onGoogleRequested);
  }

  final AuthRepository _authRepository;

  Future<void> _onSubmitted(
    RegisterSubmitted event,
    Emitter<RegisterState> emit,
  ) async {
    // Валидация на клиенте — понятнее ошибки, чем от Firebase.
    if (event.displayName.trim().isEmpty) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: 'Enter your name',
      ));
      return;
    }
    if (event.email.trim().isEmpty) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: 'Enter your email',
      ));
      return;
    }
    if (event.password.length < 6) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: 'Password must be at least 6 characters',
      ));
      return;
    }
    if (event.password != event.confirmPassword) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: 'Passwords do not match',
      ));
      return;
    }

    emit(state.copyWith(status: RegisterStatus.loading));
    try {
      await _authRepository.signUpWithEmail(
        email: event.email,
        password: event.password,
        displayName: event.displayName,
      );
      emit(state.copyWith(status: RegisterStatus.success));
    } on FirebaseAuthException catch (e) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: _mapAuthError(e),
      ));
    } catch (_) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: 'Something went wrong. Try again.',
      ));
    }
  }

  Future<void> _onGoogleRequested(
    RegisterWithGoogleRequested event,
    Emitter<RegisterState> emit,
  ) async {
    emit(state.copyWith(status: RegisterStatus.loading));
    try {
      final ok = await _authRepository.signInWithGoogle();
      if (!ok) {
        emit(state.copyWith(status: RegisterStatus.initial));
        return;
      }
      emit(state.copyWith(status: RegisterStatus.success));
    } on FirebaseAuthException catch (e) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: _mapAuthError(e),
      ));
    } catch (_) {
      emit(state.copyWith(
        status: RegisterStatus.failure,
        errorMessage: 'Google sign-in failed',
      ));
    }
  }

  String _mapAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'email-already-in-use':
        return 'This email is already registered';
      case 'invalid-email':
        return 'Invalid email format';
      case 'weak-password':
        return 'Password is too weak';
      case 'operation-not-allowed':
        return 'Email/password sign-up is disabled';
      case 'network-request-failed':
        return 'No internet connection';
      default:
        return e.message ?? 'Registration failed';
    }
  }
}
