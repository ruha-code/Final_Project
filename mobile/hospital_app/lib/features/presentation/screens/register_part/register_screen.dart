import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/register/register_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/register_part/widgets/build_text_field.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) =>
          RegisterBloc(authRepository: ctx.read<AuthRepository>()),
      child: const _RegisterView(),
    );
  }
}

class _RegisterView extends StatefulWidget {
  const _RegisterView();

  @override
  State<_RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<_RegisterView> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.accent,
      body: SafeArea(
        child: BlocListener<RegisterBloc, RegisterState>(
          listenWhen: (prev, curr) =>
              prev.status != curr.status &&
              curr.status == RegisterStatus.failure,
          listener: (context, state) {
            if (state.errorMessage != null) {
              ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(SnackBar(
                  content: Text(state.errorMessage!),
                  backgroundColor: Colors.red.shade600,
                ));
            }
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: BlocBuilder<RegisterBloc, RegisterState>(
              builder: (context, state) {
                final isLoading = state.status == RegisterStatus.loading;
                return Column(
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
                    const SizedBox(height: 32),
                    const Text(
                      'Create Your Medlink Account',
                      style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A1A2E)),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Choose your role and register',
                      style:
                          TextStyle(fontSize: 13, color: Colors.black45),
                    ),
                    const SizedBox(height: 20),
                    // ── Role selector ──
                    _RoleSelector(
                      role: state.role,
                      onChanged: (r) => context
                          .read<RegisterBloc>()
                          .add(RegisterRoleChanged(r)),
                    ),
                    const SizedBox(height: 16),
                    BuildTextField(
                        controller: _nameController, hint: 'Full name'),
                    const SizedBox(height: 12),
                    BuildTextField(
                      controller: _emailController,
                      hint: 'Email Address',
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
                            .read<RegisterBloc>()
                            .add(const RegisterPasswordVisibilityToggled()),
                      ),
                    ),
                    const SizedBox(height: 12),
                    BuildTextField(
                      controller: _confirmPasswordController,
                      hint: 'Confirm Password',
                      obscure: state.obscureConfirm,
                      suffixIcon: IconButton(
                        icon: Icon(
                          state.obscureConfirm
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          size: 18,
                          color: Colors.black38,
                        ),
                        onPressed: () => context
                            .read<RegisterBloc>()
                            .add(const RegisterConfirmVisibilityToggled()),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: Checkbox(
                            value: state.agreeTerms,
                            onChanged: (v) => context
                                .read<RegisterBloc>()
                                .add(RegisterTermsChanged(v ?? false)),
                            activeColor: AppColors.primary,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text('I agree to the ',
                            style: TextStyle(
                                fontSize: 13, color: Colors.black54)),
                        const Text(
                          'Terms & Conditions',
                          style: TextStyle(
                              fontSize: 13,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: (state.agreeTerms && !isLoading)
                            ? () => context.read<RegisterBloc>().add(
                                  RegisterSubmitted(
                                    displayName: _nameController.text,
                                    email: _emailController.text,
                                    password: _passwordController.text,
                                    confirmPassword:
                                        _confirmPasswordController.text,
                                  ),
                                )
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor:
                              AppColors.primary.withValues(alpha: 0.5),
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
                                    strokeWidth: 2.2, color: Colors.white),
                              )
                            : const Text('Create Account',
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
                          const Text('Already have an account? ',
                              style: TextStyle(
                                  fontSize: 13, color: Colors.black45)),
                          GestureDetector(
                            onTap: isLoading
                                ? null
                                : () => Navigator.pop(context),
                            child: const Text(
                              'Login',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// Две карточки выбора роли. Подсвечивается выбранная.
class _RoleSelector extends StatelessWidget {
  final UserRole role;
  final ValueChanged<UserRole> onChanged;

  const _RoleSelector({required this.role, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _RoleTile(
            label: 'Doctor',
            icon: Icons.medical_services_outlined,
            selected: role == UserRole.doctor,
            onTap: () => onChanged(UserRole.doctor),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _RoleTile(
            label: 'Patient',
            icon: Icons.person_outline,
            selected: role == UserRole.patient,
            onTap: () => onChanged(UserRole.patient),
          ),
        ),
      ],
    );
  }
}

class _RoleTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _RoleTile({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : const Color(0xFFE0E0E0),
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            Icon(icon,
                size: 28,
                color: selected ? Colors.white : AppColors.textPrimary),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
