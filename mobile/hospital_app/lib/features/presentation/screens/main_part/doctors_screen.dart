import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/doctor_detail_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/doctor_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DoctorsScreen extends StatelessWidget {
  const DoctorsScreen({super.key});

  static const _filters = [
    'All',
    'General',
    'Pediatrics',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
  ];

  static const _doctors = [
    _DoctorData(
      name: 'Dr. Amelia Hart',
      initials: 'A',
      avatarColor: AppColors.accent,
      specialty: 'Cardiology',
      schedule: 'Mon-Fri 08:00-16:00',
      availability: 'Available',
      availabilityColor: AppColors.primary,
    ),
    _DoctorData(
      name: 'Dr. Nina Alvarez',
      initials: 'N',
      avatarColor: AppColors.primary,
      specialty: 'Dermatology',
      schedule: 'Tue-Sat 09:00-17:00',
      availability: 'Available',
      availabilityColor: AppColors.primary,
    ),
    _DoctorData(
      name: 'Dr. Daniel Dneng',
      initials: 'D',
      avatarColor: AppColors.pink,
      specialty: 'Orthopedics',
      schedule: 'Mon-Thu 10:00-18:00',
      availability: 'Busy',
      availabilityColor: AppColors.orange,
    ),
    _DoctorData(
      name: 'Dr. Kim Young',
      initials: 'K',
      avatarColor: AppColors.dark,
      specialty: 'General',
      schedule: 'Mon-Fri 08:00-16:00',
      availability: 'Available',
      availabilityColor: AppColors.primary,
    ),
  ];

  List<_DoctorData> _filtered(int selectedFilter) {
    if (selectedFilter == 0) return _doctors;
    final label = _filters[selectedFilter];
    return _doctors.where((d) => d.specialty == label).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: BlocBuilder<DoctorBloc, DoctorState>(
          builder: (context, state) {
            final filtered = _filtered(state.selectedFilter);
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
                  ...filtered.map((d) => DoctorCard(
                        name: d.name,
                        initials: d.initials,
                        avatarColor: d.avatarColor,
                        specialty: d.specialty,
                        schedule: d.schedule,
                        availability: d.availability,
                        availabilityColor: d.availabilityColor,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => DoctorDetailScreen(
                                doctor: DoctorDetailData(
                                  name: d.name,
                                  initials: d.initials,
                                  avatarColor: d.avatarColor,
                                  specialty: d.specialty,
                                  experience: '15 years exp.',
                                  availability: d.availability,
                                  availabilityColor: d.availabilityColor,
                                  description: 'Specializes in ${d.specialty.toLowerCase()}, diagnosis, treatment and patient care.',
                                  phone: '+7 7XX XXX XXXX',
                                  email: '${d.name.split(' ').last.toLowerCase()}@medlink.com',
                                  location: 'Almaty, Kazakhstan',
                                  patients: 410,
                                  appointments: 820,
                                  rating: 4.8,
                                ),
                              ),
                            ),
                          );
                        },
                      )),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _DoctorData {
  final String name;
  final String initials;
  final Color avatarColor;
  final String specialty;
  final String schedule;
  final String availability;
  final Color availabilityColor;

  const _DoctorData({
    required this.name,
    required this.initials,
    required this.avatarColor,
    required this.specialty,
    required this.schedule,
    required this.availability,
    required this.availabilityColor,
  });
}