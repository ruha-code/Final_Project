import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/navigation/navigation_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/dashboard_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/appoinments_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/patients_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/doctors_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/more_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/bottom_nav_bar.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  static const _screens = <Widget>[
    DashboardScreen(),
    AppointmentsScreen(),
    PatientsScreen(),
    DoctorsScreen(),
    MoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NavigationBloc, NavigationState>(
      builder: (context, state) {
        return Scaffold(
          body: IndexedStack(
            index: state.selectedIndex,
            children: _screens,
          ),
          bottomNavigationBar: BottomNavBar(
            selectedIndex: state.selectedIndex,
            onTap: (index) {
              context
                  .read<NavigationBloc>()
                  .add(NavigationTabChanged(index));
            },
          ),
        );
      },
    );
  }
}
