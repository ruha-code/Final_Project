import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/doctor.dart';
import 'package:hospital_app/features/data/repositories/doctor_repository.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/register_part/widgets/build_text_field.dart';

/// Один экран и для добавления, и для редактирования.
/// Если [doctor] == null — режим Add. Иначе — Edit (поля предзаполнены).
class DoctorEditScreen extends StatefulWidget {
  final Doctor? doctor;
  const DoctorEditScreen({super.key, this.doctor});

  @override
  State<DoctorEditScreen> createState() => _DoctorEditScreenState();
}

class _DoctorEditScreenState extends State<DoctorEditScreen> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _scheduleCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _addressCtrl;

  late String _specialty;
  late String _availability;
  bool _saving = false;

  bool get _isEdit => widget.doctor != null;

  @override
  void initState() {
    super.initState();
    final d = widget.doctor;
    _nameCtrl = TextEditingController(text: d?.name ?? '');
    _scheduleCtrl = TextEditingController(text: d?.schedule ?? '');
    _phoneCtrl = TextEditingController(text: d?.phone ?? '');
    _emailCtrl = TextEditingController(text: d?.email ?? '');
    _addressCtrl = TextEditingController(text: d?.address ?? '');
    _specialty = d?.specialty ?? doctorSpecialties.first;
    _availability = d?.availability ?? doctorAvailabilities.first;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _scheduleCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSave() async {
    // Минимальная валидация: имя и расписание обязательны.
    final name = _nameCtrl.text.trim();
    final schedule = _scheduleCtrl.text.trim();
    if (name.isEmpty) return _snack('Name is required');
    if (schedule.isEmpty) return _snack('Schedule is required');

    setState(() => _saving = true);

    final repo = context.read<DoctorRepository>();
    final base = widget.doctor;
    final draft = Doctor(
      id: base?.id ?? '',
      name: name,
      specialty: _specialty,
      schedule: schedule,
      availability: _availability,
      phone: _phoneCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      createdAt: base?.createdAt,
    );

    try {
      if (_isEdit) {
        await repo.update(draft);
      } else {
        await repo.add(draft);
      }
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      _snack('Save failed: $e', error: true);
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: error ? Colors.red.shade600 : null,
      ));
  }

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
                subtitle: _isEdit ? 'Edit doctor' : 'New doctor',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              Text(
                _isEdit ? 'Edit Doctor' : 'Add Doctor',
                style:
                    const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              _label('Name'),
              BuildTextField(controller: _nameCtrl, hint: 'Dr. Amelia Hart'),
              const SizedBox(height: 12),
              _label('Specialty'),
              _dropdown(
                value: _specialty,
                items: doctorSpecialties,
                onChanged: (v) => setState(() => _specialty = v!),
              ),
              const SizedBox(height: 12),
              _label('Schedule'),
              BuildTextField(
                  controller: _scheduleCtrl, hint: 'Mon-Fri 08:00-16:00'),
              const SizedBox(height: 12),
              _label('Availability'),
              _dropdown(
                value: _availability,
                items: doctorAvailabilities,
                onChanged: (v) => setState(() => _availability = v!),
              ),
              const SizedBox(height: 12),
              _label('Phone'),
              BuildTextField(
                controller: _phoneCtrl,
                hint: '+7 700 000 0000',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              _label('Email'),
              BuildTextField(
                controller: _emailCtrl,
                hint: 'doctor@medlink.com',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              _label('Address'),
              BuildTextField(
                  controller: _addressCtrl, hint: 'Almaty, Kazakhstan'),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _saving ? null : _onSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    disabledBackgroundColor:
                        AppColors.primary.withValues(alpha: 0.5),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2.2),
                        )
                      : Text(_isEdit ? 'Save changes' : 'Create',
                          style: const TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6, top: 2),
        child: Text(text,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary)),
      );

  Widget _dropdown({
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down,
              color: AppColors.textTertiary),
          items: items
              .map((it) => DropdownMenuItem(value: it, child: Text(it)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
