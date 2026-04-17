import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/bottom_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/doctor_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});

  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  int _selectedFilter = 0;
  int _selectedNavIndex = 3;

  final _filters = [
    'All',
    'General',
    'Pediatrics',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
  ];

  final _doctors = const [
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

  List<_DoctorData> get _filtered {
    if (_selectedFilter == 0) return _doctors;
    final label = _filters[_selectedFilter];
    return _doctors.where((d) => d.specialty == label).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              TopNavBar(
                actions: [
                  const MedlinkNotificationButton(),
                  const SizedBox(width: 10),
                  const MedlinkGridButton(),
                  const SizedBox(width: 10),
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
                selectedIndex: _selectedFilter,
                onTap: (i) => setState(() => _selectedFilter = i),
                scrollable: true,
              ),
              const SizedBox(height: 16),
              ..._filtered.map((d) => DoctorCard(
                    name: d.name,
                    initials: d.initials,
                    avatarColor: d.avatarColor,
                    specialty: d.specialty,
                    schedule: d.schedule,
                    availability: d.availability,
                    availabilityColor: d.availabilityColor,
                  )),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      bottomNavigationBar: BottomNavBar(
        selectedIndex: _selectedNavIndex,
        onTap: (i) => setState(() => _selectedNavIndex = i),
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