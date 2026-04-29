import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/patient_part/chat_screen.dart';

/// Со стороны доктора Messages — это та же общая чат-комната, что и у
/// пациентов. Один и тот же ChatScreen, просто открывается в навигации
/// доктора. Так не дублируем код.
class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) => const ChatScreen();
}
