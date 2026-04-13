import 'package:flutter/material.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  @override
  Widget build(BuildContext context) {
    final _emailController = TextEditingController();
    final _passwordController = TextEditingController();
    bool obscurePassword = true;

    @override
    void dispose() {
      _emailController.dispose();
      _passwordController.dispose();
      super.dispose(); 
    }

    final size = MediaQuery.of(context).size;
    final topPad = size.height * 0.19;
    final bottomPad = size.height * 0.02;

    return Scaffold(
      backgroundColor: Color(0xFFE7F4F2),
      body: Column(
        children: [
          SizedBox(height: topPad),
          Center(
            child: Text(
              'Stay on Top of Every Detail',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.teal,
              ),
            ),
          ),
          SizedBox(height: topPad),
          Text(
            'Welcome back to Medlink',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: bottomPad),
          Text(
            'Sign in to your account to continue',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: bottomPad),
          
        ],
      ),
    );
  }
}