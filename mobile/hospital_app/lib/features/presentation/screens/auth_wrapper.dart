import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/main_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/register_part/login_screen.dart';

/// Корневой виджет приложения (устанавливается как `home:` у MaterialApp).
///
/// Смотрит на [AuthBloc]:
///  - unknown          → сплэш (пока Firebase отдаёт первое состояние)
///  - authenticated    → главный экран приложения
///  - unauthenticated  → экран логина
///
/// При любой смене статуса сбрасывает стек навигации до корня, чтобы открытые
/// "под крышкой" экраны (например, /profile) не висели поверх нового root'а.
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listenWhen: (prev, curr) => prev.status != curr.status,
      buildWhen: (prev, curr) => prev.status != curr.status,
      listener: (context, state) {
        final navigator = Navigator.of(context);
        if (navigator.canPop()) {
          navigator.popUntil((route) => route.isFirst);
        }
      },
      builder: (context, state) {
        switch (state.status) {
          case AuthStatus.authenticated:
            return const MainScreen();
          case AuthStatus.unauthenticated:
            return const LoginScreen();
          case AuthStatus.unknown:
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
