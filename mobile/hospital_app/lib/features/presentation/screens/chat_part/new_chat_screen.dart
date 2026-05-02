import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/user_profile.dart';
import 'package:hospital_app/features/data/repositories/auth_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/chat_part/chat_room_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

class NewChatScreen extends StatelessWidget {
  const NewChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthBloc>().state;
    final myUid = auth.user?.uid;
    final myRole = auth.role;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('New chat',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: myUid == null
          ? const Center(child: Text('Not signed in'))
          : StreamBuilder<List<UserProfile>>(
              stream: myRole == UserRole.patient
                  ? context
                      .read<AuthRepository>()
                      .watchUsersByRole(UserRole.doctor)
                  : context.read<AuthRepository>().watchAllUsers(),
              builder: (ctx, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final all = snap.hasError
                    ? const <UserProfile>[]
                    : (snap.data ?? const []);
                final candidates =
                    all.where((p) => p.uid != myUid).toList();
                if (candidates.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'No users to chat with yet.',
                        style: TextStyle(
                            color: AppColors.textTertiary, fontSize: 13),
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  itemCount: candidates.length,
                  separatorBuilder: (_, _) => const Divider(
                      height: 1,
                      indent: 72,
                      color: AppColors.border),
                  itemBuilder: (ctx, i) {
                    final p = candidates[i];
                    final initial = p.displayName.isNotEmpty
                        ? p.displayName.characters.first.toUpperCase()
                        : '?';
                    return ListTile(
                      onTap: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => ChatRoomScreen(
                              otherUid: p.uid,
                              otherName: p.displayName.isEmpty
                                  ? p.email
                                  : p.displayName,
                              otherRole: p.role.asString,
                            ),
                          ),
                        );
                      },
                      leading: CircleAvatar(
                        radius: 22,
                        backgroundColor: p.role == UserRole.doctor
                            ? AppColors.primary
                            : AppColors.accent,
                        child: Text(initial,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700)),
                      ),
                      title: Text(
                        p.displayName.isEmpty ? p.email : p.displayName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(_roleLabel(p.role),
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textTertiary)),
                    );
                  },
                );
              },
            ),
    );
  }

  String _roleLabel(UserRole r) {
    switch (r) {
      case UserRole.doctor:
        return 'Doctor';
      case UserRole.patient:
        return 'Patient';
      case UserRole.unknown:
        return '';
    }
  }
}