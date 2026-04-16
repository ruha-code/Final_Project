import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/dashboard_screen.dart';
import 'package:hospital_app/features/presentation/screens/register_part/login_screen.dart';
import 'package:hospital_app/features/presentation/screens/register_part/register_screen.dart';

void main(){
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: '/login',
      routes: {
        '/register': (context) => const RegisterScreen(),
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
      },
    );
  }
}