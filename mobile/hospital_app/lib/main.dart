import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/appointment_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/calendar/calendar_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/messages/messages_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/navigation/navigation_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/notifications/notifications_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/patient/patient_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/privacy/privacy_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/main_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/profile_screen.dart';
import 'package:hospital_app/features/presentation/screens/register_part/login_screen.dart';
import 'package:hospital_app/features/presentation/screens/register_part/register_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        // Navigation state — must survive across tab switches.
        BlocProvider(create: (_) => NavigationBloc()),

        // Application data — shared across screens, one source of truth.
        BlocProvider(create: (_) => AppointmentBloc()),
        BlocProvider(create: (_) => DoctorBloc()),
        BlocProvider(create: (_) => PatientBloc()),

        // User settings — must persist between visits to settings screens.
        // (For cross-session persistence, wrap in HydratedBloc later.)
        BlocProvider(create: (_) => NotificationsBloc()),
        BlocProvider(create: (_) => PrivacyBloc()),

        // UX state that should survive leaving the screen:
        //  - MessagesBloc: keep the selected chat open if user navigates away.
        //  - CalendarBloc: remember the selected day.
        BlocProvider(create: (_) => MessagesBloc()),
        BlocProvider(create: (_) => CalendarBloc()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        initialRoute: '/login',
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/dashboard': (context) => const MainScreen(),
          '/profile': (context) => const ProfileScreen(),
        },
      ),
    );
  }
}
