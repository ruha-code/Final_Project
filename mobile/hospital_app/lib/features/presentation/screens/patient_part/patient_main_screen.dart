import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/chat_part/chat_list_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/my_card_screen.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_appointments_screen.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_doctors_screen.dart';

/// 4 таба для роли Patient:
///   1. My Card     — patients/{uid}
///   2. Appointments — свои бронирования + кнопка Book
///   3. Doctors      — список врачей (read-only, тап → бронирование)
///   4. Chat         — общий чат
class PatientMainScreen extends StatefulWidget {
  const PatientMainScreen({super.key});

  @override
  State<PatientMainScreen> createState() => _PatientMainScreenState();
}

class _PatientMainScreenState extends State<PatientMainScreen> {
  int _index = 0;

  static const _tabs = <Widget>[
    MyCardScreen(),
    PatientAppointmentsScreen(),
    PatientDoctorsScreen(),
    ChatListScreen(),
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
            icon: Icon(Icons.badge_outlined),
            selectedIcon: Icon(Icons.badge, color: AppColors.primary),
            label: 'My Card',
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
            label: 'Chat',
          ),
        ],
      ),
    );
  }
}
