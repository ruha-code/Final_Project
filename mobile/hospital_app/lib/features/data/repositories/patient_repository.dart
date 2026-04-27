import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hospital_app/features/data/models/patient.dart';

class PatientRepository {
  PatientRepository({FirebaseFirestore? firestore})
      : _col = (firestore ?? FirebaseFirestore.instance).collection('patients');

  final CollectionReference<Map<String, dynamic>> _col;

  Stream<List<Patient>> watchAll() {
    return _col.orderBy('name').snapshots().map(
          (snap) => snap.docs.map(Patient.fromDoc).toList(),
        );
  }

  Future<String> add(Patient patient) async {
    final ref = await _col.add(patient.toCreate());
    return ref.id;
  }

  Future<void> update(Patient patient) async {
    if (patient.id.isEmpty) {
      throw ArgumentError('Cannot update a patient with empty id');
    }
    await _col.doc(patient.id).update(patient.toUpdate());
  }

  Future<void> delete(String id) => _col.doc(id).delete();
}
