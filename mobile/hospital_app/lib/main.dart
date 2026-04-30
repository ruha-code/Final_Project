import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/appointment_repository.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/data/repositories/chat_repository.dart';
import 'package:hospital_app/features/data/repositories/doctor_repository.dart';
import 'package:hospital_app/features/data/repositories/patient_repository.dart';
import 'package:hospital_app/features/presentation/bloc/appointment/my_appointments_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/calendar/calendar_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/navigation/navigation_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/notifications/notifications_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/patient/patient_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/privacy/privacy_bloc.dart';
import 'package:hospital_app/features/presentation/screens/auth_wrapper.dart';
import 'package:hospital_app/features/presentation/screens/main_part/profile_screen.dart';
import 'package:hospital_app/firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(MyApp(
    authRepository: AuthRepository(),
    doctorRepository: DoctorRepository(),
    patientRepository: PatientRepository(),
    chatRepository: ChatRepository(),
    appointmentRepository: AppointmentRepository(),
  ));
}

class MyApp extends StatelessWidget {
  const MyApp({
    super.key,
    required this.authRepository,
    required this.doctorRepository,
    required this.patientRepository,
    required this.chatRepository,
    required this.appointmentRepository,
  });

  final AuthRepository authRepository;
  final DoctorRepository doctorRepository;
  final PatientRepository patientRepository;
  final ChatRepository chatRepository;
  final AppointmentRepository appointmentRepository;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: authRepository),
        RepositoryProvider.value(value: doctorRepository),
        RepositoryProvider.value(value: patientRepository),
        RepositoryProvider.value(value: chatRepository),
        RepositoryProvider.value(value: appointmentRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (_) => AuthBloc(authRepository: authRepository),
            lazy: false,
          ),
          BlocProvider(create: (_) => NavigationBloc()),
          BlocProvider(
              create: (_) => DoctorBloc(repository: doctorRepository)),
          BlocProvider(
              create: (_) => PatientBloc(repository: patientRepository)),

          // MyAppointmentsBloc нужен AuthBloc — берём из контекста.
          // lazy: false чтобы подписка стартовала с приложения, не с
          // первого открытия экрана.
          BlocProvider(
            lazy: false,
            create: (ctx) => MyAppointmentsBloc(
              repository: appointmentRepository,
              authBloc: ctx.read<AuthBloc>(),
            ),
          ),

          BlocProvider(create: (_) => NotificationsBloc()),
          BlocProvider(create: (_) => PrivacyBloc()),
          BlocProvider(create: (_) => CalendarBloc()),
        ],
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          home: const AuthWrapper(),
          routes: {
            '/profile': (_) => const ProfileScreen(),
          },
        ),
      ),
    );
  }
}
