import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/repositories/doctor_repository.dart';
import 'package:hospital_app/features/presentation/bloc/doctor_detail/doctor_detail_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/doctor_edit_screen.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class DoctorDetailScreen extends StatelessWidget {
  final Doctor doctor;

  const DoctorDetailScreen({super.key, required this.doctor});

  @override
  Widget build(BuildContext context) {
    // DoctorDetailBloc нужен только для тоггла "Weekly/Monthly" внизу экрана —
    // не для самих данных доктора.
    return BlocProvider(
      create: (_) => DoctorDetailBloc(),
      child: _DoctorDetailView(doctor: doctor),
    );
  }
}

class _DoctorDetailView extends StatelessWidget {
  final Doctor doctor;

  const _DoctorDetailView({required this.doctor});

  Future<void> _confirmDelete(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete doctor?'),
        content: Text(
            'This will permanently remove ${doctor.name} from the database.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    try {
      await context.read<DoctorRepository>().delete(doctor.id);
      if (!context.mounted) return;
      // Возвращаемся к списку — оттуда стрим уже подтянет обновлённый список.
      Navigator.of(context).pop();
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Delete failed: $e'),
        backgroundColor: Colors.red.shade600,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = doctor;
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
                subtitle: 'Doctor detail',
                onBack: () => Navigator.pop(context),
                actions: [
                  // Edit и Delete вместо общих "уведомления + grid".
                  IconButton(
                    icon: const Icon(Icons.edit_outlined,
                        color: AppColors.textPrimary),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DoctorEditScreen(doctor: d),
                      ),
                    ),
                  ),
                  IconButton(
                    icon:
                        const Icon(Icons.delete_outline, color: AppColors.red),
                    onPressed: () => _confirmDelete(context),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildHeader(d),
              const SizedBox(height: 16),
              Text(
                'Specializes in ${d.specialty.toLowerCase()}, working schedule: ${d.schedule}.',
                style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.5),
              ),
              const SizedBox(height: 16),
              if (d.phone.isNotEmpty)
                _ContactRow(icon: Icons.phone_outlined, text: d.phone),
              if (d.phone.isNotEmpty) const SizedBox(height: 10),
              if (d.email.isNotEmpty)
                _ContactRow(icon: Icons.email_outlined, text: d.email),
              if (d.email.isNotEmpty) const SizedBox(height: 10),
              if (d.address.isNotEmpty)
                _ContactRow(
                    icon: Icons.location_on_outlined, text: d.address),
              const SizedBox(height: 24),
              const _PerformanceCard(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(Doctor d) {
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
              color: d.avatarColor, borderRadius: BorderRadius.circular(16)),
          child: Center(
            child: Text(d.initials,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 20)),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(d.name,
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(d.specialty,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textTertiary)),
              const SizedBox(height: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: d.availabilityColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  d.availability,
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: d.availabilityColor),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Декоративный график "Performance". Данные заглушечные, поскольку
/// мы не храним статистику по врачу.
class _PerformanceCard extends StatelessWidget {
  const _PerformanceCard();

  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  static const _values = [72.0, 85.0, 68.0, 90.0, 78.0, 82.0];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DoctorDetailBloc, DoctorDetailState>(
      builder: (context, state) {
        return Container(
          padding: const EdgeInsets.all(18),
          decoration: AppDecorations.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Performance',
                      style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AppColors.textPrimary)),
                  Container(
                    decoration: BoxDecoration(
                        color: AppColors.bgGrey,
                        borderRadius: BorderRadius.circular(20)),
                    child: Row(
                      children: [
                        _toggleChip(
                            context, 'Weekly', state.chartPeriod == 0, 0),
                        _toggleChip(
                            context, 'Monthly', state.chartPeriod == 1, 1),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 120,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(_months.length, (i) {
                    final h = _values[i] / 100 * 90;
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          width: 30,
                          height: h,
                          decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(5)),
                        ),
                        const SizedBox(height: 6),
                        Text(_months[i],
                            style: const TextStyle(
                                fontSize: 9,
                                color: AppColors.textTertiary)),
                      ],
                    );
                  }),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _toggleChip(
      BuildContext context, String label, bool selected, int period) {
    return GestureDetector(
      onTap: () => context
          .read<DoctorDetailBloc>()
          .add(DoctorDetailChartToggled(period)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : AppColors.textTertiary,
          ),
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _ContactRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text,
              style: const TextStyle(
                  fontSize: 13, color: AppColors.textSecondary)),
        ),
      ],
    );
  }
}
