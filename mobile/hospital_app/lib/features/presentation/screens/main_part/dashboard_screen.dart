import 'package:flutter/material.dart';
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
              _buildTopBar(),
              const SizedBox(height: 24),
              _buildHeader(),
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
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildTopBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFEDE9FE),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.grid_view_rounded,
                  color: Color(0xFF7C3AED), size: 18),
            ),
            const SizedBox(width: 8),
            const Text(
              'Medlink',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A2E),
              ),
            ),
          ],
        ),
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.search, size: 18, color: Colors.black54),
            ),
            const SizedBox(width: 10),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFF1DB87A),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Center(
                child: Text(
                  'R',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        Text(
          'Dashboard',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E),
          ),
        ),
        SizedBox(height: 4),
        Text(
          'Hello Ruslan, welcome back!',
          style: TextStyle(
            fontSize: 13,
            color: Colors.black45,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildStatCard(
            title: 'Total Patients',
            value: '8,340',
            change: '15% vs last week',
            isPositive: true,
            accentColor: const Color(0xFF1DB87A),
          ),
          const SizedBox(width: 12),
          _buildStatCard(
            title: 'Appointments',
            value: '1,275',
            change: '8% vs yesterday',
            isPositive: true,
            accentColor: const Color(0xFF6C63FF),
          ),
          const SizedBox(width: 12),
          _buildStatCard(
            title: 'Active',
            value: '2',
            change: 'Today',
            isPositive: true,
            accentColor: const Color(0xFFFF6584),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String change,
    required bool isPositive,
    required Color accentColor,
  }) {
    return Container(
      width: 145,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF0F0F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 4,
            height: 28,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.black45,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            change,
            style: TextStyle(
              fontSize: 11,
              color: isPositive ? const Color(0xFF1DB87A) : Colors.red,
            ),
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
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF0F0F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Patient by Age Stages',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A2E),
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
                        color: Colors.black45,
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
              _buildLegendItem(const Color(0xFF1DB87A), '< 30'),
              const SizedBox(width: 16),
              _buildLegendItem(const Color(0xFF6C63FF), '31-50'),
              const SizedBox(width: 16),
              _buildLegendItem(const Color(0xFF2D2D3A), '51+'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStackedBar(List<double> segments) {
    final colors = [
      const Color(0xFF1DB87A),
      const Color(0xFF6C63FF),
      const Color(0xFF2D2D3A),
    ];
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
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
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
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF0F0F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Revenue',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A2E),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: CustomPaint(
              painter: RevenueChartPainter(),
              size: const Size(double.infinity, 120),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    final items = [
      {'icon': Icons.home_rounded, 'label': 'Home'},
      {'icon': Icons.calendar_today_rounded, 'label': 'Appts'},
      {'icon': Icons.people_rounded, 'label': 'Patients'},
      {'icon': Icons.medical_services_rounded, 'label': 'Doctors'},
      {'icon': Icons.more_horiz_rounded, 'label': 'More'},
    ];

    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (i) {
          final selected = i == _selectedIndex;
          return GestureDetector(
            onTap: () => setState(() => _selectedIndex = i),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  items[i]['icon'] as IconData,
                  size: 22,
                  color: selected
                      ? const Color(0xFF1DB87A)
                      : Colors.black38,
                ),
                const SizedBox(height: 4),
                Text(
                  items[i]['label'] as String,
                  style: TextStyle(
                    fontSize: 11,
                    color: selected
                        ? const Color(0xFF1DB87A)
                        : Colors.black38,
                    fontWeight:
                        selected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class RevenueChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final points = [0.7, 0.5, 0.6, 0.4, 0.45, 0.3, 0.2, 0.15, 0.1];
    final dx = size.width / (points.length - 1);

    final coords = List.generate(points.length, (i) {
      return Offset(i * dx, size.height * points[i]);
    });

    final fillPath = Path();
    fillPath.moveTo(0, size.height);
    fillPath.lineTo(coords[0].dx, coords[0].dy);
    for (int i = 0; i < coords.length - 1; i++) {
      final cp1 = Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i].dy);
      final cp2 =
          Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i + 1].dy);
      fillPath.cubicTo(
          cp1.dx, cp1.dy, cp2.dx, cp2.dy, coords[i + 1].dx, coords[i + 1].dy);
    }
    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFF1DB87A).withValues(alpha: 0.25),
          const Color(0xFF1DB87A).withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawPath(fillPath, fillPaint);

    final linePath = Path();
    linePath.moveTo(coords[0].dx, coords[0].dy);
    for (int i = 0; i < coords.length - 1; i++) {
      final cp1 = Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i].dy);
      final cp2 =
          Offset((coords[i].dx + coords[i + 1].dx) / 2, coords[i + 1].dy);
      linePath.cubicTo(
          cp1.dx, cp1.dy, cp2.dx, cp2.dy, coords[i + 1].dx, coords[i + 1].dy);
    }

    final linePaint = Paint()
      ..color = const Color(0xFF1DB87A)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(linePath, linePaint);

    final dotPaint = Paint()..color = const Color(0xFF1DB87A);
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