import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'login_event.dart';
part 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  LoginBloc()
      : super(const LoginState(obscurePassword: true, rememberMe: false)) {
    on<LoginPasswordVisibilityToggled>((event, emit) {
      emit(LoginState(
        obscurePassword: !state.obscurePassword,
        rememberMe: state.rememberMe,
      ));
    });
    on<LoginRememberMeChanged>((event, emit) {
      emit(LoginState(
        obscurePassword: state.obscurePassword,
        rememberMe: event.value,
      ));
    });
  }
}
