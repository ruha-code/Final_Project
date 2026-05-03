import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/models/patient.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/settings/patient_settings_screen.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

class MyCardScreen extends StatelessWidget {
  const MyCardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = context.select((AuthBloc b) => b.state.user?.uid);
    if (uid == null) {
      return const Scaffold(body: Center(child: Text('Not signed in')));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('patients')
              .doc(uid)
              .snapshots(),
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            final doc = snap.hasError ? null : snap.data;
            if (doc == null || !doc.exists) {
              return const _EmptyCard();
            }

            final patient = Patient.fromDoc(doc);
            return _CardBody(patient: patient);
          },
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.folder_open,
                size: 56, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            const Text('No medical card yet',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            const Text(
              'Your medical card will appear here once a doctor sets it up.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const PatientSettingsScreen()),
              ),
              icon: const Icon(Icons.settings, size: 18),
              label: const Text('Open settings'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CardBody extends StatelessWidget {
  final Patient patient;
  const _CardBody({required this.patient});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('My Medical Card',
                  style: TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w700)),
              IconButton(
                icon: const Icon(Icons.settings, color: AppColors.textPrimary),
                tooltip: 'Settings',
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const PatientSettingsScreen()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Avatar + имя + статус.
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: AppDecorations.card,
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: patient.avatarColor,
                  child: Text(patient.initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 12),
                Text(
                  patient.name.isEmpty ? 'Unnamed' : patient.name,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(patient.email,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textTertiary)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: patient.statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    patient.status,
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: patient.statusColor),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _InfoRow(label: 'Age', value: '${patient.age}'),
          _InfoRow(label: 'Gender', value: patient.gender),
          _InfoRow(
              label: 'Diagnosis',
              value: patient.diagnosis.isEmpty ? '—' : patient.diagnosis),
          _InfoRow(label: 'Ward', value: patient.ward),
          if (patient.room != null)
            _InfoRow(label: 'Room', value: patient.room!),
          _InfoRow(
              label: 'Doctor',
              value: patient.assignedDoctor.isEmpty
                  ? '—'
                  : patient.assignedDoctor),
          const Divider(height: 32),
          _InfoRow(
              label: 'Phone',
              value: patient.phone.isEmpty ? '—' : patient.phone),
          _InfoRow(label: 'Email', value: patient.email),
          _InfoRow(
              label: 'Address',
              value: patient.address.isEmpty ? '—' : patient.address),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.bgGrey,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text(
              'Your medical info is managed by your doctor. Contact them to update diagnosis, ward, or other clinical details.',
              style: TextStyle(
                  fontSize: 12, color: AppColors.textSecondary),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const PatientSettingsScreen()),
              ),
              icon: const Icon(Icons.settings, size: 18),
              label: const Text('Settings'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textTertiary)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }
}
