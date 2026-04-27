import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/repositories/doctor_repository.dart';
import 'package:meta/meta.dart';

part 'doctor_event.dart';
part 'doctor_state.dart';

/// Список докторов + текущий фильтр специальности.
///
/// Подписывается на [DoctorRepository.watchAll] в конструкторе — UI получает
/// обновления автоматически после любых add/update/delete (репозиторий сам
/// эмитит новый список при изменениях в Firestore).
class DoctorBloc extends Bloc<DoctorEvent, DoctorState> {
  DoctorBloc({required DoctorRepository repository})
      : _repository = repository,
        super(const DoctorState.initial()) {
    on<_DoctorListUpdated>(_onListUpdated);
    on<_DoctorListFailed>(_onListFailed);
    on<DoctorFilterChanged>(_onFilterChanged);

    _subscription = _repository.watchAll().listen(
      (doctors) => add(_DoctorListUpdated(doctors)),
      onError: (Object e) => add(_DoctorListFailed(e.toString())),
    );
  }

  final DoctorRepository _repository;
  late final StreamSubscription<List<Doctor>> _subscription;

  void _onListUpdated(_DoctorListUpdated e, Emitter<DoctorState> emit) {
    emit(state.copyWith(
      status: DoctorStatus.loaded,
      doctors: e.doctors,
      errorMessage: null,
    ));
  }

  void _onListFailed(_DoctorListFailed e, Emitter<DoctorState> emit) {
    emit(state.copyWith(
      status: DoctorStatus.error,
      errorMessage: e.message,
    ));
  }

  void _onFilterChanged(DoctorFilterChanged e, Emitter<DoctorState> emit) {
    emit(state.copyWith(selectedFilter: e.filterIndex));
  }

  @override
  Future<void> close() {
    _subscription.cancel();
    return super.close();
  }
}
