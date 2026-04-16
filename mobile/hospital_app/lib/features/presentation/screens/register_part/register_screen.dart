import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/register_part/widgets/build_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _agreeTerms = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  static const _teal = Color(0xFF2DBFAD);
  static const _bgColor = Color(0xFFE8F5F3);

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
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
                  color: Color(0xFF2A7A72),
                ),
              ),
              const SizedBox(height: 48),
              const Text(
                'Create Your Medlink Account',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A2E),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Register to access hospital dashboard',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.black45,
                ),
              ),
              const SizedBox(height: 24),
              BuildTextField(
                controller: _usernameController,
                hint: 'Username',
              ),
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
                obscure: _obscurePassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: Colors.black38,
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),
              const SizedBox(height: 12),
              BuildTextField(
                controller: _confirmPasswordController,
                hint: 'Confirm Password',
                obscure: _obscureConfirm,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirm
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: Colors.black38,
                  ),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: Checkbox(
                      value: _agreeTerms,
                      onChanged: (v) =>
                          setState(() => _agreeTerms = v ?? false),
                      activeColor: _teal,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'I agree to the ',
                    style: TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: const Text(
                      'Terms & Conditions',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF2DBFAD),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _agreeTerms ? () {
                    Navigator.pushReplacementNamed(context, '/dashboard');                  
                  } : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _teal,
                    disabledBackgroundColor: _teal.withValues(alpha: 0.5),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Create Account',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
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
                      style: TextStyle(fontSize: 13, color: Colors.black45),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Text(
                        'Login',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF2DBFAD),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}