import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:hospital_app/features/data/models/appointment.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:meta/meta.dart';

part 'my_appointments_event.dart';
part 'my_appointments_state.dart';

/// "Мои записи" для текущего юзера.
///
/// Сам определяет — кто сейчас залогинен и в какой роли — и подписывается
/// на нужный стрим: доктор видит записи к нему, пациент — записи где он
/// patient. Когда auth-стейт меняется (logout / смена роли), переподписывается.
class MyAppointmentsBloc
    extends Bloc<MyAppointmentsEvent, MyAppointmentsState> {
  MyAppointmentsBloc({
    required AppointmentRepository repository,
    required AuthBloc authBloc,
  })  : _repository = repository,
        _authBloc = authBloc,
        super(const MyAppointmentsState.initial()) {
    on<_ListUpdated>(_onListUpdated);
    on<_ListFailed>(_onListFailed);
    on<MyAppointmentsFilterChanged>(_onFilterChanged);

    // Реагируем на смену юзера / роли.
    _authSub = _authBloc.stream.listen((_) => _resubscribeIfNeeded());
    _resubscribeIfNeeded();
  }

  final AppointmentRepository _repository;
  final AuthBloc _authBloc;
  late final StreamSubscription<AuthState> _authSub;
  StreamSubscription<List<Appointment>>? _dataSub;
  String? _currentUid;
  UserRole? _currentRole;

  void _resubscribeIfNeeded() {
    if (isClosed) return; // Bloc уже закрыт, не дёргаемся.

    final s = _authBloc.state;
    final uid = s.user?.uid;
    final role = s.role;

    // Никаких изменений — ничего не делаем.
    if (uid == _currentUid && role == _currentRole) return;

    _dataSub?.cancel();
    _currentUid = uid;
    _currentRole = role;

    if (uid == null || role == UserRole.unknown) {
      // Сбрасываем список.
      add(const _ListUpdated([]));
      return;
    }

    final stream = role == UserRole.doctor
        ? _repository.watchAppointmentsForDoctor(uid)
        : _repository.watchAppointmentsForPatient(uid);

    _dataSub = stream.listen(
      (list) {
        if (!isClosed) add(_ListUpdated(list));
      },
      onError: (Object e) {
        if (!isClosed) add(_ListFailed(e.toString()));
      },
    );
  }

  void _onListUpdated(_ListUpdated e, Emitter<MyAppointmentsState> emit) {
    emit(state.copyWith(
      status: MyAppointmentsStatus.loaded,
      appointments: e.list,
      errorMessage: null,
    ));
  }

  void _onListFailed(_ListFailed e, Emitter<MyAppointmentsState> emit) {
    emit(state.copyWith(
        status: MyAppointmentsStatus.error, errorMessage: e.message));
  }

  void _onFilterChanged(
      MyAppointmentsFilterChanged e, Emitter<MyAppointmentsState> emit) {
    emit(state.copyWith(filter: e.filter));
  }

  @override
  Future<void> close() {
    _authSub.cancel();
    _dataSub?.cancel();
    return super.close();
  }
}
