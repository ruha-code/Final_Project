import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/patient/patient_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/doctor_detail_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/patient_detail_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

/// Глобальный поиск по докторам и пациентам.
///
/// Поиск идёт на клиенте по уже загруженным спискам (DoctorBloc / PatientBloc) —
/// это нормально, т.к. данные у нас и так стримятся в память.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool _matches(String haystack, String needle) =>
      haystack.toLowerCase().contains(needle);

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();

    final doctors = context.select((DoctorBloc b) => b.state.doctors);
    final patients = context.select((PatientBloc b) => b.state.patients);

    final List<Doctor> matchedDoctors = q.isEmpty
        ? const []
        : doctors
            .where((d) =>
                _matches(d.name, q) ||
                _matches(d.specialty, q) ||
                _matches(d.email, q))
            .toList();
    final List<Patient> matchedPatients = q.isEmpty
        ? const []
        : patients
            .where((p) =>
                _matches(p.name, q) ||
                _matches(p.diagnosis, q) ||
                _matches(p.email, q))
            .toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: TextField(
          controller: _controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Search doctors, patients, diagnosis...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: AppColors.textTertiary),
          ),
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 15),
          onChanged: (v) => setState(() => _query = v),
        ),
        actions: [
          if (_query.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                _controller.clear();
                setState(() => _query = '');
              },
            ),
        ],
      ),
      body: q.isEmpty
          ? const _SearchHint()
          : (matchedDoctors.isEmpty && matchedPatients.isEmpty)
              ? const _NoResults()
              : ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    if (matchedDoctors.isNotEmpty) ...[
                      const _SectionTitle(label: 'Doctors'),
                      ...matchedDoctors.map((d) => _DoctorTile(doctor: d)),
                    ],
                    if (matchedPatients.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const _SectionTitle(label: 'Patients'),
                      ...matchedPatients.map((p) => _PatientTile(patient: p)),
                    ],
                    const SizedBox(height: 24),
                  ],
                ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String label;
  const _SectionTitle({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.textTertiary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _DoctorTile extends StatelessWidget {
  final Doctor doctor;
  const _DoctorTile({required this.doctor});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: doctor.avatarColor,
        child: Text(doctor.initials,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      title: Text(doctor.name,
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text('${doctor.specialty} · Doctor'),
      trailing: const Icon(Icons.chevron_right, size: 18),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => DoctorDetailScreen(doctor: doctor)),
      ),
    );
  }
}

class _PatientTile extends StatelessWidget {
  final Patient patient;
  const _PatientTile({required this.patient});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: patient.avatarColor,
        child: Text(patient.initials,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      title: Text(patient.name,
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(
          '${patient.diagnosis.isEmpty ? "No diagnosis" : patient.diagnosis} · Patient'),
      trailing: const Icon(Icons.chevron_right, size: 18),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => PatientDetailScreen(patient: patient)),
      ),
    );
  }
}

class _SearchHint extends StatelessWidget {
  const _SearchHint();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Start typing to search by name, specialty, diagnosis or email.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textTertiary, fontSize: 13),
        ),
      ),
    );
  }
}

class _NoResults extends StatelessWidget {
  const _NoResults();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'No matches found.',
        style: TextStyle(color: AppColors.textTertiary, fontSize: 13),
      ),
    );
  }
}
