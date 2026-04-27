import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/data/repositories/patient_repository.dart';
import 'package:meta/meta.dart';

part 'patient_event.dart';
part 'patient_state.dart';

class PatientBloc extends Bloc<PatientEvent, PatientState> {
  PatientBloc({required PatientRepository repository})
      : _repository = repository,
        super(const PatientState.initial()) {
    on<_PatientListUpdated>(_onListUpdated);
    on<_PatientListFailed>(_onListFailed);
    on<PatientFilterChanged>(_onFilterChanged);

    _subscription = _repository.watchAll().listen(
      (patients) => add(_PatientListUpdated(patients)),
      onError: (Object e) => add(_PatientListFailed(e.toString())),
    );
  }

  final PatientRepository _repository;
  late final StreamSubscription<List<Patient>> _subscription;

  void _onListUpdated(_PatientListUpdated e, Emitter<PatientState> emit) {
    emit(state.copyWith(
      status: PatientStatus.loaded,
      patients: e.patients,
      errorMessage: null,
    ));
  }

  void _onListFailed(_PatientListFailed e, Emitter<PatientState> emit) {
    emit(state.copyWith(
      status: PatientStatus.error,
      errorMessage: e.message,
    ));
  }

  void _onFilterChanged(PatientFilterChanged e, Emitter<PatientState> emit) {
    emit(state.copyWith(selectedFilter: e.filterIndex));
  }

  @override
  Future<void> close() {
    _subscription.cancel();
    return super.close();
  }
}
