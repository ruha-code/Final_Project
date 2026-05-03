import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

/// Сменить email. Используем `verifyBeforeUpdateEmail` — это значит, что
/// email фактически не меняется, пока юзер не кликнет ссылку в новом
/// почтовом ящике. Это рекомендуемый способ Firebase в 2024+.
class ChangeEmailScreen extends StatefulWidget {
  const ChangeEmailScreen({super.key});

  @override
  State<ChangeEmailScreen> createState() => _ChangeEmailScreenState();
}

class _ChangeEmailScreenState extends State<ChangeEmailScreen> {
  final _newEmailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _saving = false;
  bool _obscure = true;
  String? _error;
  bool _success = false;

  @override
  void dispose() {
    _newEmailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _error = null;
      _success = false;
    });

    final newEmail = _newEmailCtrl.text.trim();
    final pwd = _passwordCtrl.text;

    if (newEmail.isEmpty || pwd.isEmpty) {
      setState(() => _error = 'Fill in all fields');
      return;
    }
    if (!newEmail.contains('@') || !newEmail.contains('.')) {
      setState(() => _error = 'Enter a valid email');
      return;
    }
    final currentEmail = context.read<AuthBloc>().state.user?.email;
    if (newEmail == currentEmail) {
      setState(() => _error = 'New email must differ from current');
      return;
    }

    setState(() => _saving = true);
    try {
      await context
          .read<AuthRepository>()
          .changeEmail(currentPassword: pwd, newEmail: newEmail);
      if (!mounted) return;
      setState(() => _success = true);
    } on FirebaseAuthException catch (e) {
      setState(() => _error = _mapAuthError(e));
    } catch (e) {
      setState(() => _error = 'Failed: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _mapAuthError(FirebaseAuthException e) {
    switch (e.code) {
      case 'wrong-password':
      case 'invalid-credential':
        return 'Current password is incorrect';
      case 'email-already-in-use':
        return 'This email is already in use';
      case 'invalid-email':
        return 'Invalid email format';
      case 'requires-recent-login':
        return 'Sign out and sign in again, then try';
      case 'network-request-failed':
        return 'No internet connection';
      default:
        return e.message ?? 'Failed to change email';
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentEmail = context.select((AuthBloc b) => b.state.user?.email);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: const Text('Change email',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_success) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Verification email sent',
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary)),
                  const SizedBox(height: 6),
                  Text(
                    'We sent a confirmation link to ${_newEmailCtrl.text.trim()}. Open it to finish changing your email. Until then your email is still ${currentEmail ?? "the old one"}.',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Done'),
              ),
            ),
          ] else ...[
            Text('Current email: ${currentEmail ?? "—"}',
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textTertiary)),
            const SizedBox(height: 16),
            TextField(
              controller: _newEmailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'New email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordCtrl,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'Current password',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(_obscure
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style: const TextStyle(
                      color: AppColors.red, fontSize: 13)),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.2, color: Colors.white))
                    : const Text('Send verification',
                        style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
