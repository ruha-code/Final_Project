import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/personal_info_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/setting_info_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Берём текущего юзера из AuthBloc. Экран открывается только из
    // авторизованной части приложения, так что user почти всегда != null,
    // но на всякий случай подстилаем defaults.
    final user = context.select((AuthBloc b) => b.state.user);
    final displayName =
        (user?.displayName?.trim().isNotEmpty ?? false) ? user!.displayName! : 'User';
    final email = user?.email ?? '—';
    final photoUrl = user?.photoURL;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              TopNavBar(
                subtitle: 'Profile',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text('Profile',
                  style:
                      TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 24),
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.grey.shade200,
                      backgroundImage:
                          photoUrl != null ? NetworkImage(photoUrl) : null,
                      child: photoUrl == null
                          ? Text(
                              _initials(displayName),
                              style: const TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black54),
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(displayName,
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(email,
                        style: const TextStyle(
                            fontSize: 14, color: Colors.grey)),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Active',
                              style: TextStyle(
                                  fontSize: 10, color: Colors.green)),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Pro Plan',
                              style:
                                  TextStyle(fontSize: 10, color: Colors.blue)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 24),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Expanded(
                            child: Column(
                              children: [
                                Text('2.5y',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold)),
                                SizedBox(height: 4),
                                Text('Experience',
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          SizedBox(width: 1, height: 40),
                          Expanded(
                            child: Column(
                              children: [
                                Text('1,240',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold)),
                                SizedBox(height: 4),
                                Text('Tasks done',
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          SizedBox(width: 1, height: 40),
                          Expanded(
                            child: Column(
                              children: [
                                Text('98%',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold)),
                                SizedBox(height: 4),
                                Text('Uptime',
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Personal Information',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold)),
                        TextButton(
                          onPressed: () {},
                          child: const Text('Edit',
                              style:
                                  TextStyle(fontSize: 12, color: Colors.green)),
                        ),
                      ],
                    ),
                    // Имя и email — из Firebase. Остальное пока захардкожено
                    // (см. уточнение пользователя: доп. поля оставить статикой).
                    PersonalInfoCard(
                      icon: const Icon(Icons.person,
                          size: 20, color: Colors.blue),
                      label: 'Name',
                      value: displayName,
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: const Icon(Icons.email,
                          size: 20, color: Colors.blue),
                      label: 'Email',
                      value: email,
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: const Icon(Icons.phone,
                          size: 20, color: Colors.blue),
                      label: 'Phone',
                      value: '+1 234 567 890',
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon:
                          const Icon(Icons.key, size: 20, color: Colors.blue),
                      label: 'Role',
                      value: 'Administrator',
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: const Icon(Icons.house_sharp,
                          size: 20, color: Colors.blue),
                      label: 'Department',
                      value: 'Management',
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: const Icon(Icons.sd_card,
                          size: 20, color: Colors.blue),
                      label: 'Employee ID',
                      value: _shortUid(user?.uid),
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: const Icon(Icons.calendar_today,
                          size: 20, color: Colors.blue),
                      label: 'Joined',
                      value: _formatDate(user?.metadata.creationTime),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Security Settings',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    SettingsInfoCard(
                      title: 'Change Password',
                      subtitle: 'Update your password',
                    ),
                    SizedBox(height: 8),
                    SettingsInfoCard(
                      title: 'Two-Factor Authentication',
                      subtitle: 'Enabled via SMS',
                    ),
                    SizedBox(height: 8),
                    SettingsInfoCard(
                      title: 'Login history',
                      subtitle: 'View your recent login activities',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 50,
                width: double.infinity,
                child: ElevatedButton(
                  style: ButtonStyle(
                    backgroundColor:
                        WidgetStateProperty.all(Colors.red[100]),
                  ),
                  onPressed: () {
                    // Логаут. Навигацию делает AuthWrapper: как только
                    // AuthBloc становится unauthenticated, он вернёт нас
                    // на LoginScreen и попутно почистит стек.
                    context.read<AuthBloc>().add(const AuthSignOutRequested());
                  },
                  child: const Text('Logout',
                      style: TextStyle(fontSize: 16, color: Colors.red)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }

  String _shortUid(String? uid) {
    if (uid == null || uid.isEmpty) return '—';
    if (uid.length <= 8) return uid.toUpperCase();
    return uid.substring(0, 8).toUpperCase();
  }

  String _formatDate(DateTime? d) {
    if (d == null) return '—';
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }
}
