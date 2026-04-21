import 'package:flutter/material.dart';
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
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/dashboard': (context) => const MainScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}
