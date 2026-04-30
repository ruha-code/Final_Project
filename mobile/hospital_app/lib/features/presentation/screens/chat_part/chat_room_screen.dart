import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hospital_app/features/data/repositories/chat_repository.dart';
import 'package:hospital_app/features/presentation/bloc/auth/auth_bloc.dart';
import 'package:hospital_app/features/presentation/screens/main_part/widgets/app_constant.dart';

/// Один диалог 1-на-1. Знает uid и имя собеседника — этого достаточно,
/// chatId считается на лету из обоих uid.
class ChatRoomScreen extends StatefulWidget {
  final String otherUid;
  final String otherName;
  final String otherRole;

  const ChatRoomScreen({
    super.key,
    required this.otherUid,
    required this.otherName,
    required this.otherRole,
  });

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final _textCtrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  Future<void> _send(BuildContext context) async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    final auth = context.read<AuthBloc>().state;
    final myUid = auth.user?.uid;
    final myName = auth.profile?.displayName.isNotEmpty == true
        ? auth.profile!.displayName
        : (auth.user?.email ?? 'User');
    final myRole = auth.profile?.role.asString ?? '';
    if (myUid == null) return;

    setState(() => _sending = true);
    try {
      await context.read<ChatRepository>().sendMessage(
            myUid: myUid,
            myName: myName,
            myRole: myRole,
            otherUid: widget.otherUid,
            otherName: widget.otherName,
            otherRole: widget.otherRole,
            text: text,
          );
      _textCtrl.clear();
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Send failed: $e'),
        backgroundColor: Colors.red,
      ));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final myUid = context.select((AuthBloc b) => b.state.user?.uid) ?? '';
    final chatId = ChatRepository.chatIdFor(myUid, widget.otherUid);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.otherName,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            if (widget.otherRole.isNotEmpty)
              Text(_roleLabel(widget.otherRole),
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textTertiary)),
          ],
        ),
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(
              child: StreamBuilder<List<ChatMessage>>(
                stream: context.read<ChatRepository>().watchMessages(chatId),
                builder: (ctx, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  // Игнорируем ошибки стрима (PERMISSION_DENIED при логауте).
                  final messages = snap.hasError
                      ? const <ChatMessage>[]
                      : (snap.data ?? const []);
                  if (messages.isEmpty) {
                    return const Center(
                      child: Text(
                        'No messages yet. Say hi!',
                        style: TextStyle(
                            color: AppColors.textTertiary, fontSize: 13),
                      ),
                    );
                  }
                  return ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    itemCount: messages.length,
                    itemBuilder: (ctx, i) {
                      final msg = messages[i];
                      return _Bubble(
                        msg: msg,
                        isMine: msg.authorUid == myUid,
                      );
                    },
                  );
                },
              ),
            ),
            _Input(
              controller: _textCtrl,
              sending: _sending,
              onSend: () => _send(context),
            ),
          ],
        ),
      ),
    );
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'doctor':
        return 'Doctor';
      case 'patient':
        return 'Patient';
      default:
        return '';
    }
  }
}

class _Bubble extends StatelessWidget {
  final ChatMessage msg;
  final bool isMine;
  const _Bubble({required this.msg, required this.isMine});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          Container(
            constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isMine ? AppColors.primary : AppColors.bgGrey,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(14),
                topRight: const Radius.circular(14),
                bottomLeft: Radius.circular(isMine ? 14 : 4),
                bottomRight: Radius.circular(isMine ? 4 : 14),
              ),
            ),
            child: Text(
              msg.text,
              style: TextStyle(
                fontSize: 14,
                color: isMine ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Input extends StatelessWidget {
  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  const _Input({
    required this.controller,
    required this.sending,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              decoration: InputDecoration(
                hintText: 'Type a message...',
                filled: true,
                fillColor: AppColors.bgGrey,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: sending ? null : onSend,
            icon: sending
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2.2),
                  )
                : const Icon(Icons.send, color: AppColors.primary),
          ),
        ],
      ),
    );
  }
}
