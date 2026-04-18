import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              TopNavBar(
                subtitle: 'Inventory',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'Inventory',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),

              // ── Stats Grid ──
              _buildStatsGrid(),
              const SizedBox(height: 12),

              // ── Usage Trend ──
              _buildUsageTrend(),
              const SizedBox(height: 12),

              // ── Category Breakdown ──
              _buildCategoryBreakdown(),
              const SizedBox(height: 12),

              // ── Stock Items ──
              _buildStockItems(),
              const SizedBox(height: 12),

              // ── Recent Activity ──
              _buildRecentActivity(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    const stats = [
      _StatData(val: '1,260', label: 'Total Items', icon: Icons.inventory_2_outlined, color: AppColors.primary),
      _StatData(val: '34', label: 'Low Stock', icon: Icons.warning_amber_rounded, color: Color(0xFFF59E0B)),
      _StatData(val: '7', label: 'Out of Stock', icon: Icons.block_rounded, color: Color(0xFFEF4444)),
      _StatData(val: '19', label: 'Orders', icon: Icons.local_shipping_outlined, color: Color(0xFF3B82F6)),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.7,
      children: stats.map((s) {
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: AppShadows.cardLight,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(s.icon, size: 20, color: s.color),
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(color: s.color, shape: BoxShape.circle),
                  ),
                ],
              ),
              const Spacer(),
              Text(s.val, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(s.label, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildUsageTrend() {
    final data = [
      _UsageData('Jan', 65),
      _UsageData('Feb', 80),
      _UsageData('Mar', 55),
      _UsageData('Apr', 90),
      _UsageData('May', 75),
      _UsageData('Jun', 60),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Usage Trend', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          SizedBox(
            height: 110,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((d) {
                final h = d.val / 100 * 90;
                final opacity = 0.7 + (d.val / 100) * 0.3;
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      width: 34,
                      height: h,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: opacity),
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(d.month, style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBreakdown() {
    const categories = [
      _CategoryData(name: 'Surgical', pct: 85, color: AppColors.primary),
      _CategoryData(name: 'Pharma', pct: 72, color: Color(0xFF3B82F6)),
      _CategoryData(name: 'PPE', pct: 60, color: Color(0xFF8B5CF6)),
      _CategoryData(name: 'Lab', pct: 45, color: Color(0xFFF59E0B)),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Category Breakdown', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...categories.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(c.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
                        Text('${c.pct}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: c.pct / 100,
                        backgroundColor: AppColors.border,
                        valueColor: AlwaysStoppedAnimation(c.color),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildStockItems() {
    const items = [
      _StockItem(name: 'Surgical Gloves', stock: 850, status: 'In Stock', color: AppColors.primary),
      _StockItem(name: 'Paracetamol', stock: 34, status: 'Low Stock', color: Color(0xFFF59E0B)),
      _StockItem(name: 'COVID Test Kit', stock: 0, status: 'Out of Stock', color: Color(0xFFEF4444)),
      _StockItem(name: 'Syringes 5ml', stock: 420, status: 'In Stock', color: AppColors.primary),
      _StockItem(name: 'Bandages', stock: 18, status: 'Low Stock', color: Color(0xFFF59E0B)),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Stock Items', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...List.generate(items.length, (i) {
            final item = items[i];
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                border: i < items.length - 1
                    ? const Border(bottom: BorderSide(color: AppColors.border))
                    : null,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13, color: AppColors.textPrimary)),
                      const SizedBox(height: 2),
                      Text('Qty: ${item.stock}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: item.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      item.status,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: item.color),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    const activities = [
      _ActivityData(text: '50 gloves ordered', color: AppColors.primary, icon: Icons.assignment_outlined),
      _ActivityData(text: '2 items restocked', color: Color(0xFF3B82F6), icon: Icons.check_circle_outline),
      _ActivityData(text: 'New shipment arrived', color: Color(0xFF8B5CF6), icon: Icons.markunread_mailbox_outlined),
      _ActivityData(text: '4 expired items flagged', color: Color(0xFFEF4444), icon: Icons.error_outline),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Recent Activity', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          ...activities.map((a) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Icon(a.icon, size: 16, color: a.color),
                    const SizedBox(width: 10),
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(color: a.color, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 10),
                    Text(a.text, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

class _StatData {
  final String val, label;
  final IconData icon;
  final Color color;
  const _StatData({required this.val, required this.label, required this.icon, required this.color});
}

class _UsageData {
  final String month;
  final double val;
  const _UsageData(this.month, this.val);
}

class _CategoryData {
  final String name;
  final int pct;
  final Color color;
  const _CategoryData({required this.name, required this.pct, required this.color});
}

class _StockItem {
  final String name, status;
  final int stock;
  final Color color;
  const _StockItem({required this.name, required this.stock, required this.status, required this.color});
}

class _ActivityData {
  final String text;
  final Color color;
  final IconData icon;
  const _ActivityData({required this.text, required this.color, required this.icon});
}
