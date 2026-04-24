import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/appointment_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/calendar/calendar_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/messages/messages_bloc.dart';
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
  runApp(MyApp(authRepository: AuthRepository()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.authRepository});
  final AuthRepository authRepository;

  @override
  Widget build(BuildContext context) {
    // RepositoryProvider делает AuthRepository доступным через context.read
    // по всему приложе нию — из login/register-экранов и т.д.
    return RepositoryProvider.value(
      value: authRepository,
      child: MultiBlocProvider(
        providers: [
          // Глобальный auth-стейт: слушает authStateChanges и переключает
          // AuthWrapper между Login и Main.
          BlocProvider(
            create: (_) => AuthBloc(authRepository: authRepository),
            lazy: false, // сразу стартуем, чтобы подписка заработала с первого кадра
          ),

          // Navigation state — переживает смену табов.
          BlocProvider(create: (_) => NavigationBloc()),

          // Данные приложения — один источник правды.
          BlocProvider(create: (_) => AppointmentBloc()),
          BlocProvider(create: (_) => DoctorBloc()),
          BlocProvider(create: (_) => PatientBloc()),

          // Настройки пользователя.
          BlocProvider(create: (_) => NotificationsBloc()),
          BlocProvider(create: (_) => PrivacyBloc()),

          // UX-состояние экранов, переживающее навигацию.
          BlocProvider(create: (_) => MessagesBloc()),
          BlocProvider(create: (_) => CalendarBloc()),
        ],
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          // Роутинг по auth-состоянию делает AuthWrapper — он сам выбирает
          // между LoginScreen и MainScreen, поэтому initialRoute не нужен.
          home: const AuthWrapper(),
          routes: {
            // /login и /dashboard больше не named — ими рулит AuthWrapper.
            // /register тоже не нужен в routes: он пушится как MaterialPageRoute.
            '/profile': (_) => const ProfileScreen(),
          },
        ),
      ),
    );
  }
}
