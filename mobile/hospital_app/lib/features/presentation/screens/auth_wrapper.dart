import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/main_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_main_screen.dart';
import 'package:hospital_app/features/presentation/screens/register_part/login_screen.dart';

/// Корневой роут.
///
///  unauthenticated         → LoginScreen
///  unknown / no profile    → splash
///  authenticated, doctor   → MainScreen (полный набор табов)
///  authenticated, patient  → PatientMainScreen (My Card / Doctors / Chat)
///  authenticated, unknown  → ошибка (профиль есть, но роль не определена)
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listenWhen: (prev, curr) => prev.status != curr.status,
      listener: (context, state) {
        final navigator = Navigator.of(context);
        if (navigator.canPop()) {
          navigator.popUntil((route) => route.isFirst);
        }
      },
      // Перерисовываемся не на любое изменение, а только когда меняется
      // что-то, влияющее на выбор корневого экрана.
      buildWhen: (prev, curr) =>
          prev.status != curr.status || prev.role != curr.role,
      builder: (context, state) {
        switch (state.status) {
          case AuthStatus.unauthenticated:
            return const LoginScreen();

          case AuthStatus.authenticated:
            switch (state.role) {
              case UserRole.doctor:
                return const MainScreen();
              case UserRole.patient:
                return const PatientMainScreen();
              case UserRole.unknown:
                return const _RoleErrorScreen();
            }

          case AuthStatus.unknown:
          case AuthStatus.authenticatedNoProfile:
            return const _SplashScreen();
        }
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.accent,
      body: Center(
        child: CircularProgressIndicator(color: Colors.white),
      ),
    );
  }
}

/// Юзер залогинен, но в Firestore нет users/{uid} с валидной ролью.
/// Случается, если документ удалили вручную или регистрация была старая.
class _RoleErrorScreen extends StatelessWidget {
  const _RoleErrorScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline,
                    size: 56, color: AppColors.red),
                const SizedBox(height: 16),
                const Text(
                  'Profile not found',
                  style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your account exists but its role is missing. Please sign out and register again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context
                      .read<AuthBloc>()
                      .add(const AuthSignOutRequested()),
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
