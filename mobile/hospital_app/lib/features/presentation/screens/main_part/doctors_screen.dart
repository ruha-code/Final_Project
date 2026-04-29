import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/doctor_detail_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/doctor_edit_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/doctor_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DoctorsScreen extends StatelessWidget {
  const DoctorsScreen({super.key});

  // Первый элемент — "All". Остальные совпадают с doctorSpecialties.
  static const _filters = ['All', ...doctorSpecialties];

  List<Doctor> _filtered(List<Doctor> all, int selectedFilter) {
    if (selectedFilter == 0) return all;
    final label = _filters[selectedFilter];
    return all.where((d) => d.specialty == label).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: BlocBuilder<DoctorBloc, DoctorState>(
          builder: (context, state) {
            final filtered = _filtered(state.doctors, state.selectedFilter);

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
                    title: 'Doctors',
                    subtitle: 'Manage your data easily',
                  ),
                  const SizedBox(height: 20),
                  FilterTabs(
                    labels: _filters,
                    selectedIndex: state.selectedFilter,
                    onTap: (i) => context
                        .read<DoctorBloc>()
                        .add(DoctorFilterChanged(i)),
                    scrollable: true,
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
        heroTag: 'doctors_fab',
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DoctorEditScreen()),
        ),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  /// Решаем, что показать на месте списка: лоадер / ошибку / пустой стейт /
  /// собственно карточки. Вынесено сюда, чтобы build() не разрастался.
  Widget _body(
      BuildContext context, DoctorState state, List<Doctor> filtered) {
    if (state.status == DoctorStatus.initial) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (state.status == DoctorStatus.error) {
      return _ErrorBox(message: state.errorMessage ?? 'Failed to load');
    }
    if (filtered.isEmpty) {
      return _EmptyBox(
        message: state.doctors.isEmpty
            ? 'No doctors yet. Tap + to add the first one.'
            : 'No doctors match this filter.',
      );
    }
    return Column(
      children: filtered
          .map((d) => DoctorCard(
                name: d.name,
                initials: d.initials,
                avatarColor: d.avatarColor,
                specialty: d.specialty,
                schedule: d.schedule,
                availability: d.availability,
                availabilityColor: d.availabilityColor,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => DoctorDetailScreen(doctor: d)),
                ),
              ))
          .toList(),
    );
  }
}

class _EmptyBox extends StatelessWidget {
  final String message;
  const _EmptyBox({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Center(
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
        ),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
          children: [
            const Icon(Icons.error_outline,
                size: 36, color: AppColors.textTertiary),
            const SizedBox(height: 8),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
