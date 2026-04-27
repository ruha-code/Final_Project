import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/presentation/bloc/patient/patient_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/patient_detail_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/patient_edit_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/patient_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class PatientsScreen extends StatelessWidget {
  const PatientsScreen({super.key});

  static const _filters = ['All', 'Inpatient', 'Outpatient'];

  List<Patient> _filtered(List<Patient> all, int selectedFilter) {
    if (selectedFilter == 0) return all;
    final label = _filters[selectedFilter];
    return all.where((p) => p.ward == label).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: BlocBuilder<PatientBloc, PatientState>(
          builder: (context, state) {
            final filtered = _filtered(state.patients, state.selectedFilter);

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),
                  TopNavBar(
                    actions: const [
                      MedlinkNotificationButton(),
                      SizedBox(width: 10),
                      MedlinkGridButton(),
                      SizedBox(width: 10),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const SectionHeader(
                    title: 'Patients',
                    subtitle: 'Manage your data easily',
                  ),
                  const SizedBox(height: 20),
                  FilterTabs(
                    labels: _filters,
                    selectedIndex: state.selectedFilter,
                    onTap: (i) => context
                        .read<PatientBloc>()
                        .add(PatientFilterChanged(i)),
                  ),
                  const SizedBox(height: 16),
                  _body(context, state, filtered),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'patients_fab',
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PatientEditScreen()),
        ),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _body(
      BuildContext context, PatientState state, List<Patient> filtered) {
    if (state.status == PatientStatus.initial) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (state.status == PatientStatus.error) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Column(
            children: [
              const Icon(Icons.error_outline,
                  size: 36, color: AppColors.textTertiary),
              const SizedBox(height: 8),
              Text(state.errorMessage ?? 'Failed to load',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 13)),
            ],
          ),
        ),
      );
    }
    if (filtered.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Center(
          child: Text(
            state.patients.isEmpty
                ? 'No patients yet. Tap + to add the first one.'
                : 'No patients match this filter.',
            textAlign: TextAlign.center,
            style:
                const TextStyle(color: AppColors.textTertiary, fontSize: 13),
          ),
        ),
      );
    }

    // Использую данные пациента напрямую — без расчёта высоты в см и т.п.,
    // это поле теперь не хранится. Карточка показывает то, что реально есть.
    return Column(
      children: filtered
          .map((p) => PatientCard(
                name: p.name,
                initials: p.initials,
                avatarColor: p.avatarColor,
                gender: p.gender,
                age: p.age,
                heightCm: 0, // не используется, см. patient_card
                diagnosis: p.diagnosis,
                status: p.status,
                statusColor: p.statusColor,
                doctor: p.assignedDoctor.isEmpty ? '—' : p.assignedDoctor,
                ward: p.ward,
                room: p.room,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => PatientDetailScreen(patient: p)),
                ),
              ))
          .toList(),
    );
  }
}
