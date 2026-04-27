import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'appointment_card.dart'; 


class PatientCard extends StatelessWidget {
  final String name;
  final String initials;
  final Color avatarColor;
  final String gender;
  final int age;
  final int heightCm;
  final String diagnosis;
  final String status;
  final Color statusColor;
  final String doctor;
  final String ward;
  final String? room;
  final VoidCallback? onTap;

  const PatientCard({
    super.key,
    required this.name,
    required this.initials,
    required this.avatarColor,
    required this.gender,
    required this.age,
    required this.heightCm,
    required this.diagnosis,
    required this.status,
    required this.statusColor,
    required this.doctor,
    required this.ward,
    this.room,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: AppDecorations.card,
        child: Column(
          children: [
            _buildTopRow(),
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: 12),
            _buildDetailsRow(),
            if (room != null) ...[
              const SizedBox(height: 6),
              _buildRoomRow(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTopRow() {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: avatarColor,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Center(
            child: Text(
              initials,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                heightCm > 0
                    ? '$gender, $age    ${heightCm}cm   $diagnosis'
                    : '$gender, $age   $diagnosis',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
        ),
        StatusBadge(label: status, color: statusColor),
      ],
    );
  }

  Widget _buildDetailsRow() {
    return Row(
      children: [
        const Icon(Icons.person_outline,
            size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(
          doctor,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
        const SizedBox(width: 16),
        const Icon(Icons.local_hospital_outlined,
            size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(
          ward,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildRoomRow() {
    return Row(
      children: [
        const Icon(Icons.meeting_room_outlined,
            size: 14, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(
          room!,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
      ],
    );
  }
}