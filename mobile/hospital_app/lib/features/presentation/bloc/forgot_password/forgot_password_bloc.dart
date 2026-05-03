import 'package:bloc/bloc.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';

part 'forgot_password_event.dart';
part 'forgot_password_state.dart';

class ForgotPasswordBloc
    extends Bloc<ForgotPasswordEvent, ForgotPasswordState> {
  final AuthRepository _authRepository;

  ForgotPasswordBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(ForgotPasswordInitial()) {
    on<ForgotPasswordSubmitted>(_onSubmitted);
  }

  Future<void> _onSubmitted(
    ForgotPasswordSubmitted event,
    Emitter<ForgotPasswordState> emit,
  ) async {
    emit(ForgotPasswordLoading());
    try {
      await _authRepository.sendPasswordResetEmail(event.email);
      emit(ForgotPasswordSuccess());
    } on FirebaseAuthException catch (e) {
      // user-not-found намеренно проглатываем и показываем Success.
      // Это рекомендация Firebase: иначе по ответу можно было бы
      // перебирать существующие email'ы.
      if (e.code == 'user-not-found') {
        emit(ForgotPasswordSuccess());
        return;
      }
      emit(ForgotPasswordFailure(_mapErrorToMessage(e.code)));
    } catch (_) {
      emit(ForgotPasswordFailure('An unexpected error occurred'));
    }
  }

  String _mapErrorToMessage(String code) {
    switch (code) {
      case 'invalid-email':
        return 'Invalid email address';
      case 'too-many-requests':
        return 'Too many requests. Please try again later';
      case 'network-request-failed':
        return 'No internet connection';
      default:
        return 'Error sending email';
    }
  }
}
