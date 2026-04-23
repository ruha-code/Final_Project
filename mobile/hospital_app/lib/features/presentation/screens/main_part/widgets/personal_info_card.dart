import 'package:flutter/material.dart';

class PersonalInfoCard extends StatelessWidget {
  final Icon icon;
  final String label;
  final String value;

  const PersonalInfoCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: 40,
            height: 40,
            color: Colors.blue.withValues(alpha: 0.1),
            child: icon,
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          ]                       
        ),
      ],
    );
  }
}
