import 'package:flutter/material.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/top_nav_bar.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  int? _selectedChat;

  static const _contacts = [
    _ContactData(id: 1, name: 'Dr. Patel N.', initials: 'PN', color: Color(0xFF3B82F6), unread: 2, lastMsg: 'Can we schedule a review?', time: '10:32 AM'),
    _ContactData(id: 2, name: 'Susan Wong', initials: 'SW', color: Color(0xFFEC4899), unread: 0, lastMsg: 'Results are ready.', time: '9:15 AM'),
    _ContactData(id: 3, name: 'Indra Smith', initials: 'IS', color: Color(0xFFF59E0B), unread: 0, lastMsg: 'Thank you!', time: 'Yesterday'),
    _ContactData(id: 4, name: 'Dr. Kim Young', initials: 'KY', color: AppColors.primary, unread: 1, lastMsg: 'Meeting at 3pm?', time: 'Yesterday'),
  ];

  static const _chats = <int, List<_MsgData>>{
    1: [
      _MsgData(fromMe: false, text: "Hi! How are Daniel Wong's latest results?", time: '10:20 AM'),
      _MsgData(fromMe: true, text: 'They look stable. Blood pressure slightly elevated.', time: '10:25 AM'),
      _MsgData(fromMe: false, text: 'Good. Can we schedule a review?', time: '10:32 AM'),
    ],
    2: [
      _MsgData(fromMe: true, text: 'Are the lab results back yet?', time: '9:00 AM'),
      _MsgData(fromMe: false, text: 'Yes, just finalized. Results are ready.', time: '9:15 AM'),
    ],
    3: [
      _MsgData(fromMe: false, text: 'Can you help with the scheduling?', time: '3:00 PM'),
      _MsgData(fromMe: true, text: "Of course, I'll send you the link.", time: '3:05 PM'),
      _MsgData(fromMe: false, text: 'Thank you!', time: '3:06 PM'),
    ],
    4: [
      _MsgData(fromMe: false, text: 'Hey, are you free this afternoon?', time: '2:10 PM'),
      _MsgData(fromMe: false, text: 'Meeting at 3pm?', time: '2:15 PM'),
    ],
  };

  @override
  Widget build(BuildContext context) {
    if (_selectedChat != null) {
      return _buildChatView();
    }
    return _buildContactList();
  }

  // ── Contact List ──
  Widget _buildContactList() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              TopNavBar(
                subtitle: 'Messages',
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 24),
              const Text(
                'Messages',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  itemCount: _contacts.length,
                  itemBuilder: (context, i) {
                    final c = _contacts[i];
                    return GestureDetector(
                      onTap: () => setState(() => _selectedChat = c.id),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          border: i < _contacts.length - 1
                              ? const Border(bottom: BorderSide(color: AppColors.border))
                              : null,
                        ),
                        child: Row(
                          children: [
                            // Avatar with unread badge
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: c.color.withValues(alpha: 0.12),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      c.initials,
                                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: c.color),
                                    ),
                                  ),
                                ),
                                if (c.unread > 0)
                                  Positioned(
                                    top: -2,
                                    right: -2,
                                    child: Container(
                                      width: 18,
                                      height: 18,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEF4444),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white, width: 2),
                                      ),
                                      child: Center(
                                        child: Text(
                                          '${c.unread}',
                                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
                                      Text(c.time, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    c.lastMsg,
                                    style: const TextStyle(fontSize: 13, color: AppColors.textTertiary),
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Chat View ──
  Widget _buildChatView() {
    final contact = _contacts.firstWhere((c) => c.id == _selectedChat);
    final msgs = _chats[_selectedChat] ?? [];

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Chat header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => setState(() => _selectedChat = null),
                    child: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.textPrimary),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: contact.color.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        contact.initials,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: contact.color),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(contact.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                        const Text('Online', style: TextStyle(fontSize: 11, color: AppColors.primary)),
                      ],
                    ),
                  ),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.phone_outlined, size: 14, color: AppColors.primary),
                  ),
                ],
              ),
            ),

            // Messages
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: msgs.length,
                itemBuilder: (context, i) {
                  final m = msgs[i];
                  return Align(
                    alignment: m.fromMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: m.fromMe ? AppColors.primary : const Color(0xFFF0F0F5),
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(18),
                          topRight: const Radius.circular(18),
                          bottomLeft: Radius.circular(m.fromMe ? 18 : 4),
                          bottomRight: Radius.circular(m.fromMe ? 4 : 18),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            m.text,
                            style: TextStyle(
                              fontSize: 14,
                              color: m.fromMe ? Colors.white : AppColors.textPrimary,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            m.time,
                            style: TextStyle(
                              fontSize: 10,
                              color: m.fromMe
                                  ? Colors.white.withValues(alpha: 0.6)
                                  : AppColors.textTertiary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Input
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Text(
                        'Type a message...',
                        style: TextStyle(fontSize: 14, color: AppColors.textTertiary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.send, size: 18, color: AppColors.textTertiary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactData {
  final int id;
  final String name, initials, lastMsg, time;
  final Color color;
  final int unread;
  const _ContactData({required this.id, required this.name, required this.initials, required this.color, required this.unread, required this.lastMsg, required this.time});
}

class _MsgData {
  final bool fromMe;
  final String text, time;
  const _MsgData({required this.fromMe, required this.text, required this.time});
}
