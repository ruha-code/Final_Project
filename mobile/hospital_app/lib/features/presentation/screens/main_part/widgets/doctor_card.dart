import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

class DoctorCard extends StatelessWidget {
  final String name;
  final String initials;
  final Color avatarColor;
  final String specialty;
  final String schedule;
  final String availability;
  final Color availabilityColor;
  final VoidCallback? onCall;
  final VoidCallback? onTap;

  const DoctorCard({
    super.key,
    required this.name,
    required this.initials,
    required this.avatarColor,
    required this.specialty,
    required this.schedule,
    required this.availability,
    required this.availabilityColor,
    this.onCall,
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
        child: Row(
          children: [
            _buildAvatar(),
            const SizedBox(width: 12),
            Expanded(child: _buildInfo()),
            _buildCallButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: avatarColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            color: avatarColor,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
    );
  }

  Widget _buildInfo() {
    return Column(
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
          specialty,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          schedule,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textTertiary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          availability,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: availabilityColor,
          ),
        ),
      ],
    );
  }

  Widget _buildCallButton() {
    return GestureDetector(
      onTap: onCall,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.phone, size: 18, color: Colors.white),
      ),
    );
  }
}