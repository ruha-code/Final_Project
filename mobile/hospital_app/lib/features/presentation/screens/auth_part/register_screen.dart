import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/register/register_bloc.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/auth_part/widgets/build_text_field.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) {
        final bloc = RegisterBloc(
          authRepository: ctx.read<AuthRepository>(),
        );
        bloc.add(const RegisterRoleChanged(UserRole.patient));
        return bloc;
      },
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

  void _showTerms(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => BlocProvider.value(
        value: context.read<RegisterBloc>(),
        child: DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.75,
          maxChildSize: 0.95,
          minChildSize: 0.4,
          builder: (ctx, scrollController) => Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Terms & Conditions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Last updated: January 2025',
                style: TextStyle(fontSize: 12, color: Colors.black38),
              ),
              const Divider(height: 24),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  children: const [
                    _TermsSection(
                      title: '1. Acceptance of Terms',
                      body:
                          'By creating an account on Medlink, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this application.',
                    ),
                    _TermsSection(
                      title: '2. Use of the Service',
                      body:
                          'Medlink is intended for use by registered patients and healthcare professionals. You agree to use the service only for lawful purposes and in accordance with these terms.',
                    ),
                    _TermsSection(
                      title: '3. Account Responsibility',
                      body:
                          'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.',
                    ),
                    _TermsSection(
                      title: '4. Medical Disclaimer',
                      body:
                          'Medlink does not provide medical advice. All information is for informational purposes only. Always consult a qualified healthcare provider for medical decisions.',
                    ),
                    _TermsSection(
                      title: '5. Privacy & Data',
                      body:
                          'Your personal and health data is stored securely and will not be shared with third parties without your consent, except as required by law.',
                    ),
                    _TermsSection(
                      title: '6. Modifications',
                      body:
                          'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
                    ),
                    _TermsSection(
                      title: '7. Termination',
                      body:
                          'We reserve the right to suspend or terminate your account if you violate these terms or engage in behavior harmful to other users or the platform.',
                    ),
                    SizedBox(height: 32),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      ctx.read<RegisterBloc>().add(
                            const RegisterTermsChanged(true),
                          );
                      Navigator.pop(ctx);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text(
                      'I Agree',
                      style: TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFD0FEF0),
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
                      'Sign up to manage your health',
                      style: TextStyle(fontSize: 13, color: Colors.black45),
                    ),
                    const SizedBox(height: 24),
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
                        const Text(
                          'I agree to the ',
                          style:
                              TextStyle(fontSize: 13, color: Colors.black54),
                        ),
                        GestureDetector(
                          onTap: () => _showTerms(context),
                          child: const Text(
                            'Terms & Conditions',
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
                            : const Text(
                                'Create Account',
                                style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600),
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Already have an account? ',
                            style: TextStyle(
                                fontSize: 13, color: Colors.black45),
                          ),
                          GestureDetector(
                            onTap:
                                isLoading ? null : () => Navigator.pop(context),
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

class _TermsSection extends StatelessWidget {
  const _TermsSection({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: const TextStyle(
              fontSize: 13,
              color: Colors.black54,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}