part of 'doctor_bloc.dart';

@immutable
sealed class DoctorEvent {
  const DoctorEvent();
}

/// Внешнее: переключили chip фильтра специальности.
final class DoctorFilterChanged extends DoctorEvent {
  final int filterIndex;
  const DoctorFilterChanged(this.filterIndex);
}

/// Внутреннее: репозиторий прислал свежий список из стрима.
final class _DoctorListUpdated extends DoctorEvent {
  final List<Doctor> doctors;
  const _DoctorListUpdated(this.doctors);
}

/// Внутреннее: стрим упал с ошибкой (нет доступа в Firestore и т.п.).
final class _DoctorListFailed extends DoctorEvent {
  final String message;
  const _DoctorListFailed(this.message);
}
