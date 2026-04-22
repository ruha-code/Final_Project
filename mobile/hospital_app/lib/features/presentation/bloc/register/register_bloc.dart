import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'register_event.dart';
part 'register_state.dart';

class RegisterBloc extends Bloc<RegisterEvent, RegisterState> {
  RegisterBloc()
      : super(const RegisterState(
          obscurePassword: true,
          obscureConfirm: true,
          agreeTerms: false,
        )) {
    on<RegisterPasswordVisibilityToggled>((event, emit) {
      emit(RegisterState(
        obscurePassword: !state.obscurePassword,
        obscureConfirm: state.obscureConfirm,
        agreeTerms: state.agreeTerms,
      ));
    });
    on<RegisterConfirmVisibilityToggled>((event, emit) {
      emit(RegisterState(
        obscurePassword: state.obscurePassword,
        obscureConfirm: !state.obscureConfirm,
        agreeTerms: state.agreeTerms,
      ));
    });
    on<RegisterTermsChanged>((event, emit) {
      emit(RegisterState(
        obscurePassword: state.obscurePassword,
        obscureConfirm: state.obscureConfirm,
        agreeTerms: event.value,
      ));
    });
  }
}
