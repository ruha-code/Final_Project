import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
class TopNavBar extends StatelessWidget {
  final List<Widget> actions;

  const TopNavBar({
    super.key,
    this.actions = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Medlink',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        Row(
          children: [
            ...actions,
            if (actions.isEmpty) ...[
              _CircleIconButton(
                icon: Icons.search,
                onTap: () {},
              ),
              const SizedBox(width: 10),
            ],
            const _AvatarCircle(letter: 'R'),
          ],
        ),
      ],
    );
  }
}

class MedlinkSearchButton extends StatelessWidget {
  final VoidCallback? onTap;

  const MedlinkSearchButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return _CircleIconButton(icon: Icons.search, onTap: onTap ?? () {});
  }
}

class MedlinkNotificationButton extends StatelessWidget {
  final VoidCallback? onTap;

  const MedlinkNotificationButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return _CircleIconButton(
        icon: Icons.notifications_none, onTap: onTap ?? () {});
  }
}

class MedlinkGridButton extends StatelessWidget {
  final VoidCallback? onTap;

  const MedlinkGridButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.bgGrey,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(Icons.grid_view_rounded,
          size: 18, color: Colors.black54),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.bgGrey,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Icon(icon, size: 18, color: Colors.black54),
      ),
    );
  }
}

class _AvatarCircle extends StatelessWidget {
  final String letter;

  const _AvatarCircle({required this.letter});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Center(
        child: Text(
          letter,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
    );
  }
}