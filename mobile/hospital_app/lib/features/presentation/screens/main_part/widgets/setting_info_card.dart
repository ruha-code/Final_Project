import 'package:flutter/material.dart';

class SettingsInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;

  const SettingsInfoCard({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey))
          ],
        ),
        Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey) 
      ],
    );
  }
}