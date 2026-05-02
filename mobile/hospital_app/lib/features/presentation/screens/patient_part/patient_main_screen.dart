import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/chat_part/chat_list_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/my_card_screen.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_appointments_screen.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_dashboard_screen.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_doctors_screen.dart';

/// 5 табов:
///   1. Home   — Patient Dashboard со статистикой
///   2. Appts  — список своих записей + Book
///   3. Doctors — список врачей
///   4. Chats  — диалоги
///   5. Profile — своя медкарта (бывший таб My Card)
class PatientMainScreen extends StatefulWidget {
  const PatientMainScreen({super.key});

  @override
  State<PatientMainScreen> createState() => _PatientMainScreenState();
}

class _PatientMainScreenState extends State<PatientMainScreen> {
  int _index = 0;

  static const _tabs = <Widget>[
    PatientDashboardScreen(),
    PatientAppointmentsScreen(),
    PatientDoctorsScreen(),
    ChatListScreen(),
    MyCardScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Colors.white,
        indicatorColor: AppColors.primary.withValues(alpha: 0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: AppColors.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_note_outlined),
            selectedIcon: Icon(Icons.event_note, color: AppColors.primary),
            label: 'Appts',
          ),
          NavigationDestination(
            icon: Icon(Icons.medical_services_outlined),
            selectedIcon:
                Icon(Icons.medical_services, color: AppColors.primary),
            label: 'Doctors',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon:
                Icon(Icons.chat_bubble, color: AppColors.primary),
            label: 'Chats',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
