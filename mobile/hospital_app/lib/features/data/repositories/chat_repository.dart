import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Сообщение в чате. Простая структура: кто отправил (uid + имя + роль),
/// текст и время.
@immutable
class ChatMessage {
  final String id;
  final String authorUid;
  final String authorName;
  final String authorRole; // 'doctor' | 'patient'
  final String text;
  final DateTime? sentAt;

  const ChatMessage({
    required this.id,
    required this.authorUid,
    required this.authorName,
    required this.authorRole,
    required this.text,
    this.sentAt,
  });

  factory ChatMessage.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? const <String, dynamic>{};
    return ChatMessage(
      id: doc.id,
      authorUid: (data['authorUid'] as String?) ?? '',
      authorName: (data['authorName'] as String?) ?? '',
      authorRole: (data['authorRole'] as String?) ?? '',
      text: (data['text'] as String?) ?? '',
      sentAt: (data['sentAt'] as Timestamp?)?.toDate(),
    );
  }
}

/// Простой общий чат: все доктора и пациенты пишут в одну комнату
/// `chat_rooms/general/messages`. Этого достаточно для дипломной демки;
/// усложнить (1-на-1) — отдельная задача.
class ChatRepository {
  ChatRepository({FirebaseFirestore? firestore})
      : _col = (firestore ?? FirebaseFirestore.instance)
            .collection('chat_rooms')
            .doc('general')
            .collection('messages');

  final CollectionReference<Map<String, dynamic>> _col;

  /// Стрим последних 100 сообщений, новые сверху.
  Stream<List<ChatMessage>> watchMessages() {
    return _col
        .orderBy('sentAt', descending: true)
        .limit(100)
        .snapshots()
        .map((snap) => snap.docs.map(ChatMessage.fromDoc).toList());
  }

  Future<void> sendMessage({
    required String authorUid,
    required String authorName,
    required String authorRole,
    required String text,
  }) async {
    if (text.trim().isEmpty) return;
    await _col.add({
      'authorUid': authorUid,
      'authorName': authorName,
      'authorRole': authorRole,
      'text': text.trim(),
      'sentAt': FieldValue.serverTimestamp(),
    });
  }
}
