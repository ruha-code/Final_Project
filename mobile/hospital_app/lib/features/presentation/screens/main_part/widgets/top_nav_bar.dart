import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/search_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

class TopNavBar extends StatelessWidget {
  final List<Widget> actions;
  final String? subtitle;
  final VoidCallback? onBack;
  /// Если actions пуст и showSearch=true (по умолчанию) — показываем лупу
  /// и переход на SearchScreen. Для пациентского UI обычно false.
  final bool showSearch;

  const TopNavBar({
    super.key,
    this.actions = const [],
    this.subtitle,
    this.onBack,
    this.showSearch = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            if (onBack != null) ...[
              GestureDetector(
                onTap: onBack,
                child: const Padding(
                  padding: EdgeInsets.only(right: 8),
                  child: Icon(Icons.arrow_back_ios_new,
                      size: 18, color: AppColors.textPrimary),
                ),
              ),
            ],
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Medlink',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ],
        ),
        Row(
          children: [
            ...actions,
            if (actions.isEmpty && showSearch)
              _CircleIconButton(
                icon: Icons.search,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SearchScreen()),
                ),
              ),
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
    return _CircleIconButton(
      icon: Icons.search,
      onTap: onTap ??
          () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SearchScreen()),
              ),
    );
  }
}

class MedlinkNotificationButton extends StatelessWidget {
  final VoidCallback? onTap;
  const MedlinkNotificationButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return _CircleIconButton(
      icon: Icons.notifications_none,
      onTap: onTap ?? () {},
    );
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