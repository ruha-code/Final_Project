import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hospital_app/features/data/models/doctor.dart';

/// Тонкая обёртка над коллекцией `doctors` в Firestore.
///
/// Внешний API — только `Doctor`-объекты, никакого `Map<String, dynamic>` наружу.
class DoctorRepository {
  DoctorRepository({FirebaseFirestore? firestore})
      : _col = (firestore ?? FirebaseFirestore.instance).collection('doctors');

  final CollectionReference<Map<String, dynamic>> _col;

  /// Стрим всего списка докторов, отсортированный по имени.
  /// Bloc подписывается сюда — UI обновляется автоматически при любых изменениях.
  Stream<List<Doctor>> watchAll() {
    return _col.orderBy('name').snapshots().map(
          (snap) => snap.docs.map(Doctor.fromDoc).toList(),
        );
  }

  /// Создать. Возвращает id нового документа.
  Future<String> add(Doctor doctor) async {
    final ref = await _col.add(doctor.toCreate());
    return ref.id;
  }

  /// Обновить. У объекта обязательно должен быть id.
  Future<void> update(Doctor doctor) async {
    if (doctor.id.isEmpty) {
      throw ArgumentError('Cannot update a doctor with empty id');
    }
    await _col.doc(doctor.id).update(doctor.toUpdate());
  }

  Future<void> delete(String id) => _col.doc(id).delete();
}
