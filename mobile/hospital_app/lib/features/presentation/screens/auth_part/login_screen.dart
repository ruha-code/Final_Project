import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/login/login_bloc.dart';
import 'package:hospital_app/features/presentation/screens/auth_part/forgot_password_screen.dart';
import 'package:hospital_app/features/presentation/screens/auth_part/register_screen.dart';
import 'package:hospital_app/features/presentation/screens/auth_part/widgets/build_text_field.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => LoginBloc(authRepository: ctx.read<AuthRepository>())
        ..add(const LoginCredentialsLoadRequested()),
      child: const _LoginView(),
    );
  }
}

class _LoginView extends StatefulWidget {
  const _LoginView();

  @override
  State<_LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<_LoginView> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  // Чтобы не перезаписывать текстовые поля каждый раз при перерисовке
  // bloc'а — заполняем сохранённые credentials строго один раз.
  bool _credentialsApplied = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFD0FEF0),
      body: SafeArea(
        // BlocConsumer объединяет builder и listener в один виджет.
        // listenWhen — реагируем только на смены статуса/credential'ов,
        // чтобы не дёргать setState на каждый чих.
        child: BlocConsumer<LoginBloc, LoginState>(
          listenWhen: (prev, curr) {
            // 1. Подгрузка сохранённых credentials (один раз).
            if (!_credentialsApplied &&
                curr.savedEmail.isNotEmpty &&
                prev.savedEmail != curr.savedEmail) {
              return true;
            }
            // 2. Появление ошибки.
            if (prev.status != curr.status &&
                curr.status == LoginStatus.failure) {
              return true;
            }
            return false;
          },
          listener: (context, state) {
            // Случай 1: подставляем сохранённые email/password.
            if (!_credentialsApplied &&
                state.savedEmail.isNotEmpty) {
              _credentialsApplied = true;
              _emailController.text = state.savedEmail;
              _passwordController.text = state.savedPassword;
              return;
            }
            // Случай 2: показываем SnackBar с ошибкой.
            if (state.status == LoginStatus.failure &&
                state.errorMessage != null) {
              ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(SnackBar(
                  content: Text(state.errorMessage!),
                  backgroundColor: Colors.red.shade600,
                ));
            }
          },
          buildWhen: (prev, curr) =>
              prev.status != curr.status ||
              prev.obscurePassword != curr.obscurePassword ||
              prev.rememberMe != curr.rememberMe,
          builder: (context, state) {
            final isLoading = state.status == LoginStatus.loading;
            return SingleChildScrollView(
              child: SizedBox(
                height: MediaQuery.of(context).size.height -
                    MediaQuery.of(context).padding.top,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 48),
                      const Text(
                        'Stay on Top of Every Detail',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary),
                      ),
                      const Spacer(),
                      const Text(
                        'Welcome Back to Medlink',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1A1A2E)),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Sign in to continue',
                        style:
                            TextStyle(fontSize: 13, color: Colors.black45),
                      ),
                      const SizedBox(height: 24),
                      BuildTextField(
                        controller: _emailController,
                        hint: 'Email',
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 12),
                      BuildTextField(
                        controller: _passwordController,
                        hint: 'Password',
                        obscure: state.obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            state.obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 18,
                            color: Colors.black38,
                          ),
                          onPressed: () => context
                              .read<LoginBloc>()
                              .add(const LoginPasswordVisibilityToggled()),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: Checkbox(
                                  value: state.rememberMe,
                                  onChanged: (v) => context
                                      .read<LoginBloc>()
                                      .add(LoginRememberMeChanged(
                                          v ?? false)),
                                  activeColor: AppColors.primary,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(4)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text('Remember me',
                                  style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.black54)),
                            ],
                          ),
                          GestureDetector(
                            onTap: isLoading
                                ? null
                                : () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (_) =>
                                              const ForgotPasswordScreen()),
                                    ),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: isLoading
                              ? null
                              : () => context
                                  .read<LoginBloc>()
                                  .add(LoginSubmitted(
                                    email: _emailController.text,
                                    password: _passwordController.text,
                                  )),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            disabledBackgroundColor:
                                AppColors.primary.withValues(alpha: 0.6),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2.2,
                                      color: Colors.white),
                                )
                              : const Text('Login',
                                  style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('New to Medlink? ',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.black45)),
                            GestureDetector(
                              onTap: isLoading
                                  ? null
                                  : () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) =>
                                                const RegisterScreen()),
                                      ),
                              child: const Text(
                                'Create an account',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
