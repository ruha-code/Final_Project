import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/bottom_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/filter_tabs.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/patient_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  int _selectedFilter = 0;
  int _selectedNavIndex = 2;

  final _filters = ['All', 'Inpatient', 'Outpatient'];

  final _patients = const [
    _PatientData(
      name: 'Alicia Perth',
      initials: 'AP',
      avatarColor: AppColors.pink,
      gender: 'Female',
      age: 34,
      heightCm: 167,
      diagnosis: 'Hypertension',
      status: 'Discharged',
      statusColor: AppColors.primary,
      doctor: 'Dr. Amelia Hart',
      ward: 'Outpatient',
    ),
    _PatientData(
      name: 'Daniel Wong',
      initials: 'DW',
      avatarColor: AppColors.accent,
      gender: 'Male',
      age: 47,
      heightCm: 181,
      diagnosis: 'Bone Fracture',
      status: 'Admitted',
      statusColor: AppColors.primary,
      doctor: 'Dr. Daniel Obeng',
      ward: 'Inpatient',
      room: 'Room 402B-4th Floor',
    ),
    _PatientData(
      name: 'Sara Malik',
      initials: 'SM',
      avatarColor: AppColors.primary,
      gender: 'Female',
      age: 28,
      heightCm: 163,
      diagnosis: 'Migraine',
      status: 'Discharged',
      statusColor: AppColors.primary,
      doctor: 'Dr. Alex',
      ward: 'Outpatient',
    ),
    _PatientData(
      name: 'Oleg Petrov',
      initials: 'OP',
      avatarColor: AppColors.orange,
      gender: 'Male',
      age: 55,
      heightCm: 175,
      diagnosis: 'Diabetes',
      status: 'Admitted',
      statusColor: AppColors.primary,
      doctor: 'Dr. Ning',
      ward: 'Inpatient',
      room: 'Room 301A-3rd Floor',
    ),
  ];

  List<_PatientData> get _filtered {
    if (_selectedFilter == 0) return _patients;
    final filterLabel = _filters[_selectedFilter];
    return _patients.where((p) => p.ward == filterLabel).toList();
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
              const TopNavBar(),
              const SizedBox(height: 24),
              const SectionHeader(
                title: 'Patients',
                subtitle: 'Manage your data easily',
              ),
              const SizedBox(height: 20),
              FilterTabs(
                labels: _filters,
                selectedIndex: _selectedFilter,
                onTap: (i) => setState(() => _selectedFilter = i),
              ),
              const SizedBox(height: 16),
              ..._filtered.map((p) => PatientCard(
                    name: p.name,
                    initials: p.initials,
                    avatarColor: p.avatarColor,
                    gender: p.gender,
                    age: p.age,
                    heightCm: p.heightCm,
                    diagnosis: p.diagnosis,
                    status: p.status,
                    statusColor: p.statusColor,
                    doctor: p.doctor,
                    ward: p.ward,
                    room: p.room,
                  )),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavBar(
        selectedIndex: _selectedNavIndex,
        onTap: (i) => setState(() => _selectedNavIndex = i),
      ),
    );
  }
}

class _PatientData {
  final String name;
  final String initials;
  final Color avatarColor;
  final String gender;
  final int age;
  final int heightCm;
  final String diagnosis;
  final String status;
  final Color statusColor;
  final String doctor;
  final String ward;
  final String? room;

  const _PatientData({
    required this.name,
    required this.initials,
    required this.avatarColor,
    required this.gender,
    required this.age,
    required this.heightCm,
    required this.diagnosis,
    required this.status,
    required this.statusColor,
    required this.doctor,
    required this.ward,
    this.room,
  });
}