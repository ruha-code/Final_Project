import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

class FilterTabs extends StatelessWidget {
  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onTap;

  final bool scrollable;

  const FilterTabs({
    super.key,
    required this.labels,
    required this.selectedIndex,
    required this.onTap,
    this.scrollable = false,
  });

  @override
  Widget build(BuildContext context) {
    final chips = List.generate(labels.length, (i) {
      final selected = i == selectedIndex;
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: GestureDetector(
          onTap: () => onTap(i),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.bgGrey,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              labels[i],
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: selected ? Colors.white : Colors.black54,
              ),
            ),
          ),
        ),
      );
    });

    if (scrollable) {
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: chips),
      );
    }

    return Row(children: chips);
  }
}