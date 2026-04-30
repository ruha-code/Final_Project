import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/chat_part/chat_list_screen.dart';

/// Со стороны доктора Messages = тот же список диалогов, что у пациентов.
/// Просто проксируем — никакого дублирования кода.
class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) => const ChatListScreen();
}
