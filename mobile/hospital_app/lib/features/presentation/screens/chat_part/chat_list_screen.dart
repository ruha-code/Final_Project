import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/chat_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/chat_part/chat_room_screen.dart';
import 'package:hospital_app/features/presentation/screens/chat_part/new_chat_screen.dart';
import 'package:hospital_app/features/presentation/screens/widgets/app_constant.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final myUid = context.select((AuthBloc b) => b.state.user?.uid);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Chats',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: myUid == null
          ? const Center(child: Text('Not signed in'))
          : StreamBuilder<List<ChatThread>>(
              stream: context.read<ChatRepository>().watchChatsFor(myUid),
              builder: (ctx, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final threads =
                    snap.hasError ? const <ChatThread>[] : (snap.data ?? const []);
                if (threads.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'No chats yet.\nTap + to start a new conversation.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: AppColors.textTertiary, fontSize: 13),
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: threads.length,
                  separatorBuilder: (_, _) => const Divider(
                      height: 1,
                      indent: 72,
                      color: AppColors.border),
                  itemBuilder: (ctx, i) =>
                      _ThreadTile(thread: threads[i], myUid: myUid),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'new_chat_fab',
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const NewChatScreen()),
        ),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.chat, color: Colors.white),
      ),
    );
  }
}

class _ThreadTile extends StatelessWidget {
  final ChatThread thread;
  final String myUid;
  const _ThreadTile({required this.thread, required this.myUid});

  @override
  Widget build(BuildContext context) {
    final otherName = thread.otherName(myUid);
    final otherRole = thread.otherRole(myUid);
    final preview = thread.lastMessageAuthorUid == myUid
        ? 'You: ${thread.lastMessage}'
        : thread.lastMessage;
    final initial = otherName.isNotEmpty
        ? otherName.characters.first.toUpperCase()
        : '?';

    return ListTile(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatRoomScreen(
            otherUid: thread.otherUid(myUid),
            otherName: otherName,
            otherRole: otherRole,
          ),
        ),
      ),
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: AppColors.primary,
        child: Text(initial,
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 16)),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              otherName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          if (thread.lastMessageAt != null)
            Text(
              _formatTime(thread.lastMessageAt!),
              style: const TextStyle(
                  fontSize: 11, color: AppColors.textTertiary),
            ),
        ],
      ),
      subtitle: Text(
        preview.isEmpty ? 'No messages yet' : preview,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
            fontSize: 13, color: AppColors.textSecondary),
      ),
    );
  }

  String _formatTime(DateTime t) {
    final now = DateTime.now();
    final isToday =
        t.year == now.year && t.month == now.month && t.day == now.day;
    if (isToday) {
      return '${_two(t.hour)}:${_two(t.minute)}';
    }
    final daysDiff = now.difference(t).inDays;
    if (daysDiff < 7) {
      const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return wd[t.weekday - 1];
    }
    return '${t.year}-${_two(t.month)}-${_two(t.day)}';
  }

  String _two(int n) => n.toString().padLeft(2, '0');
}
