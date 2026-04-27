import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/data/repositories/patient_repository.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';
import 'package:hospital_app/features/presentation/screens/register_part/widgets/build_text_field.dart';

class PatientEditScreen extends StatefulWidget {
  final Patient? patient;
  const PatientEditScreen({super.key, this.patient});

  @override
  State<PatientEditScreen> createState() => _PatientEditScreenState();
}

class _PatientEditScreenState extends State<PatientEditScreen> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _ageCtrl;
  late final TextEditingController _diagnosisCtrl;
  late final TextEditingController _doctorCtrl;
  late final TextEditingController _roomCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _addressCtrl;

  late String _gender;
  late String _status;
  late String _ward;
  bool _saving = false;

  bool get _isEdit => widget.patient != null;

  @override
  void initState() {
    super.initState();
    final p = widget.patient;
    _nameCtrl = TextEditingController(text: p?.name ?? '');
    _ageCtrl =
        TextEditingController(text: p?.age != null ? p!.age.toString() : '');
    _diagnosisCtrl = TextEditingController(text: p?.diagnosis ?? '');
    _doctorCtrl = TextEditingController(text: p?.assignedDoctor ?? '');
    _roomCtrl = TextEditingController(text: p?.room ?? '');
    _phoneCtrl = TextEditingController(text: p?.phone ?? '');
    _emailCtrl = TextEditingController(text: p?.email ?? '');
    _addressCtrl = TextEditingController(text: p?.address ?? '');
    _gender = p?.gender ?? patientGenders.first;
    _status = p?.status ?? patientStatuses.first;
    _ward = p?.ward ?? patientWards.first;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _diagnosisCtrl.dispose();
    _doctorCtrl.dispose();
    _roomCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _onSave() async {
    final name = _nameCtrl.text.trim();
    final age = int.tryParse(_ageCtrl.text.trim());
    final diagnosis = _diagnosisCtrl.text.trim();

    if (name.isEmpty) return _snack('Name is required');
    if (age == null || age <= 0 || age > 150) {
      return _snack('Enter a valid age');
    }
    if (diagnosis.isEmpty) return _snack('Diagnosis is required');

    setState(() => _saving = true);

    final repo = context.read<PatientRepository>();
    final base = widget.patient;
    final roomText = _roomCtrl.text.trim();
    final draft = Patient(
      id: base?.id ?? '',
      name: name,
      age: age,
      gender: _gender,
      diagnosis: diagnosis,
      status: _status,
      ward: _ward,
      // Комната релевантна только для Inpatient. Для Outpatient — игнорируем
      // даже если введена.
      room: (_ward == 'Inpatient' && roomText.isNotEmpty) ? roomText : null,
      assignedDoctor: _doctorCtrl.text.trim(),
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
                subtitle: _isEdit ? 'Edit patient' : 'New patient',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              Text(
                _isEdit ? 'Edit Patient' : 'Add Patient',
                style:
                    const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              _label('Name'),
              BuildTextField(controller: _nameCtrl, hint: 'Alicia Perth'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Age'),
                        BuildTextField(
                          controller: _ageCtrl,
                          hint: '34',
                          keyboardType: TextInputType.number,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Gender'),
                        _dropdown(
                          value: _gender,
                          items: patientGenders,
                          onChanged: (v) => setState(() => _gender = v!),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _label('Diagnosis'),
              BuildTextField(
                  controller: _diagnosisCtrl, hint: 'Hypertension'),
              const SizedBox(height: 12),
              _label('Status'),
              _dropdown(
                value: _status,
                items: patientStatuses,
                onChanged: (v) => setState(() => _status = v!),
              ),
              const SizedBox(height: 12),
              _label('Ward'),
              _dropdown(
                value: _ward,
                items: patientWards,
                onChanged: (v) => setState(() => _ward = v!),
              ),
              if (_ward == 'Inpatient') ...[
                const SizedBox(height: 12),
                _label('Room'),
                BuildTextField(
                    controller: _roomCtrl, hint: 'Room 402B-4th Floor'),
              ],
              const SizedBox(height: 12),
              _label('Assigned doctor'),
              BuildTextField(
                  controller: _doctorCtrl, hint: 'Dr. Amelia Hart'),
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
                hint: 'patient@example.com',
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
