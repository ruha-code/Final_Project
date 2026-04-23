import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/personal_info_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/setting_info_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
              const Text('Profile', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
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
                    const CircleAvatar(
                      radius: 50,
                      backgroundImage: NetworkImage('https://i.pravatar.cc/150?img=3'),
                    ),
                    const SizedBox(height: 16),
                    const Text('Ruslan Akhmetov', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    const Text('Admin', style: TextStyle(fontSize: 14, color: Colors.grey)),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Active', style: TextStyle(fontSize: 10, color: Colors.green)),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Pro Plan', style: TextStyle(fontSize: 10, color: Colors.blue)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20)
                          ),
                            child: Column(
                              children: [
                                Text('2.5y', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text('Experience', style: TextStyle(fontSize: 12, color: Colors.grey))
                              ],
                            )
                        ),
                        Container(
                          decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20)
                          ),
                          child: Column(
                            children: [
                              Text('1,240', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('Tasks done', style: TextStyle(fontSize: 12, color: Colors.grey))
                            ],
                          )
                        ),
                        Container(
                          decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20)
                          ),
                          child: Column(
                            children: [
                              Text('98%', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('Uptime', style: TextStyle(fontSize: 12, color: Colors.grey))
                            ],
                          )
                        )
                      ],
                    ),

                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Personal Information', 
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)
                        ),
                        TextButton(
                          onPressed: () {}, 
                          child: Text('Edit', style: TextStyle(fontSize: 12, color: Colors.lightGreen))
                        )
                      ]
                    ),
                    PersonalInfoCard(
                      icon: Icon(Icons.person, size: 20, color: Colors.blue),
                      label: 'Name',
                      value: 'Ruslan Akhmetov'
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: Icon(Icons.email, size: 20, color: Colors.blue),
                      label: 'Email',
                      value: 'ruslan.akhmetov@example.com'
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: Icon(Icons.phone, size: 20, color: Colors.blue),
                      label: 'Phone',
                      value: '+1 234 567 890'
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: Icon(Icons.key, size: 20, color: Colors.blue),
                      label: 'Role',
                      value: 'Administrator',
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: Icon(Icons.house_sharp), 
                      label: 'Department', 
                      value: 'Management'
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: Icon(Icons.sd_card), 
                      label: 'Employee ID', 
                      value: '123456789'
                    ),
                    const SizedBox(height: 8),
                    PersonalInfoCard(
                      icon: Icon(Icons.calendar_today), 
                      label: 'Joined', 
                      value: 'Jan 1, 2020'
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Security Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    SettingsInfoCard(
                      title: 'Change Password',
                      subtitle: 'Update your password',
                    ),
                    const SizedBox(height: 8),
                    SettingsInfoCard(
                      title: 'Two-Factor Authentication',
                      subtitle: 'Enabled via SMS',
                    ),
                    const SizedBox(height: 8),
                    SettingsInfoCard(
                      title: 'Login history', 
                      subtitle: 'View your recent login activities'
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 50  ,
                width: double.infinity,
                child: ElevatedButton(
                  style: ButtonStyle(
                    backgroundColor: WidgetStateProperty.all(Colors.red[100]),
                  ),
                  onPressed: (){
                    Navigator.pushReplacementNamed(context, '/login');
                  }, 
                  child: Text('Logout', style: TextStyle(fontSize: 16, color: Colors.red))
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}



