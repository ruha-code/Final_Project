import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/presentation/bloc/doctor/doctor_bloc.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/widgets/doctor_card.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/patient_booking_screen.dart';

class PatientDoctorsScreen extends StatelessWidget {
  const PatientDoctorsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: BlocBuilder<DoctorBloc, DoctorState>(
          builder: (context, state) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  const Text('Doctors',
                      style: TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  const Text('Browse doctors and their specialties',
                      style: TextStyle(
                          fontSize: 13, color: AppColors.textTertiary)),
                  const SizedBox(height: 16),
                  if (state.status == DoctorStatus.initial)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 60),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (state.status == DoctorStatus.error)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Text(
                          state.errorMessage ?? 'Failed to load',
                          style: const TextStyle(
                              color: AppColors.textSecondary),
                        ),
                      ),
                    )
                  else if (state.doctors.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 60),
                      child: Center(
                        child: Text('No doctors available yet.',
                            style: TextStyle(
                                color: AppColors.textTertiary)),
                      ),
                    )
                  else
                    ...state.doctors.map((d) => DoctorCard(
                          name: d.name,
                          initials: d.initials,
                          avatarColor: d.avatarColor,
                          specialty: d.specialty,
                          schedule: d.schedule,
                          availability: d.availability,
                          availabilityColor: d.availabilityColor,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  PatientBookingScreen(doctor: d),
                            ),
                          ),
                        )),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
