import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/bottom_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/section_header.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/stat_card.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

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
              const TopNavBar(),
              const SizedBox(height: 24),
              const SectionHeader(
                title: 'Dashboard',
                subtitle: 'Hello Ruslan, welcome back!',
              ),
              const SizedBox(height: 20),
              _buildStatsRow(),
              const SizedBox(height: 24),
              _buildPatientByAgeChart(),
              const SizedBox(height: 24),
              _buildRevenueChart(),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavBar(
        selectedIndex: _selectedIndex,
        onTap: (i) => setState(() => _selectedIndex = i),
      ),
    );
  }

  Widget _buildStatsRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: const [
          StatCard(
            title: 'Total Patients',
            value: '8,340',
            change: '15% vs last week',
            accentColor: AppColors.primary,
          ),
          SizedBox(width: 12),
          StatCard(
            title: 'Appointments',
            value: '1,275',
            change: '8% vs yesterday',
            accentColor: AppColors.accent,
          ),
          SizedBox(width: 12),
          StatCard(
            title: 'Active',
            value: '2',
            change: 'Today',
            accentColor: AppColors.pink,
          ),
        ],
      ),
    );
  }

  Widget _buildPatientByAgeChart() {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final data = [
      [60.0, 50.0, 30.0],
      [70.0, 55.0, 25.0],
      [80.0, 60.0, 40.0],
      [65.0, 50.0, 35.0],
      [75.0, 45.0, 30.0],
      [40.0, 30.0, 20.0],
      [50.0, 35.0, 25.0],
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Patient by Age Stages',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary, 
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(days.length, (i) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    _buildStackedBar(data[i]),
                    const SizedBox(height: 6),
                    Text(
                      days[i],
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegendItem(AppColors.primary, '< 30'),
              const SizedBox(width: 16),
              _buildLegendItem(AppColors.accent, '31-50'),
              const SizedBox(width: 16),
              _buildLegendItem(AppColors.dark, '51+'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStackedBar(List<double> segments) {
    final colors = [AppColors.primary, AppColors.accent, AppColors.dark];
    return SizedBox(
      width: 28,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: List.generate(segments.length, (i) {
          return Container(
            width: 28,
            height: segments[i] / 2.5,
            decoration: BoxDecoration(
              color: colors[i],
              borderRadius: i == 0
                  ? const BorderRadius.vertical(top: Radius.circular(4))
                  : BorderRadius.zero,
            ),
          );
        }).reversed.toList(),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildRevenueChart() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppDecorations.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Revenue',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: CustomPaint(
              painter: _RevenueChartPainter(),
              size: const Size(double.infinity, 120),
            ),
          ),
        ],
      ),
    );
  }
}

class _RevenueChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final points = [0.7, 0.5, 0.6, 0.4, 0.45, 0.3, 0.2, 0.15, 0.1];
    final dx = size.width / (points.length - 1);
    final coords = List.generate(
        points.length, (i) => Offset(i * dx, size.height * points[i]));

    final fillPath = Path()
      ..moveTo(0, size.height)
      ..lineTo(coords[0].dx, coords[0].dy);
    for (int i = 0; i < coords.length - 1; i++) {
      final cp1 =
          Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i].dy);
      final cp2 =
          Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i + 1].dy);
      fillPath.cubicTo(
          cp1.dx, cp1.dy, cp2.dx, cp2.dy, coords[i + 1].dx, coords[i + 1].dy);
    }
    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(
      fillPath,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.primary.withValues(alpha: 0.25),
            AppColors.primary.withValues(alpha: 0.0),
          ],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );

    final linePath = Path()..moveTo(coords[0].dx, coords[0].dy);
    for (int i = 0; i < coords.length - 1; i++) {
      final cp1 =
          Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i].dy);
      final cp2 =
          Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i + 1].dy);
      linePath.cubicTo(
          cp1.dx, cp1.dy, cp2.dx, cp2.dy, coords[i + 1].dx, coords[i + 1].dy);
    }

    canvas.drawPath(
      linePath,
      Paint()
        ..color = AppColors.primary
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );

    final dotPaint = Paint()..color = AppColors.primary;
    final dotBorder = Paint()
      ..color = Colors.white
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    for (final p in coords) {
      canvas.drawCircle(p, 4, dotPaint);
      canvas.drawCircle(p, 4, dotBorder);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}