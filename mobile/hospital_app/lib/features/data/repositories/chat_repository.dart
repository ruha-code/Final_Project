import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Один сообщение в подколлекции chats/{chatId}/messages.
@immutable
class ChatMessage {
  final String id;
  final String authorUid;
  final String authorName;
  final String authorRole;
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
    final d = doc.data() ?? const <String, dynamic>{};
    return ChatMessage(
      id: doc.id,
      authorUid: (d['authorUid'] as String?) ?? '',
      authorName: (d['authorName'] as String?) ?? '',
      authorRole: (d['authorRole'] as String?) ?? '',
      text: (d['text'] as String?) ?? '',
      sentAt: (d['sentAt'] as Timestamp?)?.toDate(),
    );
  }
}

/// Диалог 1-на-1. Хранится в chats/{chatId}.
///
/// chatId = два uid'а, отсортированных и склеенных через `_`. Так у пары
/// (A, B) всегда один и тот же id вне зависимости от того, кто инициировал.
@immutable
class ChatThread {
  final String id;
  final List<String> participantUids;
  /// Карта uid → отображаемое имя. Хранится прямо в документе диалога,
  /// чтобы в списке чатов не делать N лишних запросов на профили.
  final Map<String, String> participantNames;
  final Map<String, String> participantRoles;
  final String lastMessage;
  final String? lastMessageAuthorUid;
  final DateTime? lastMessageAt;

  const ChatThread({
    required this.id,
    required this.participantUids,
    required this.participantNames,
    required this.participantRoles,
    required this.lastMessage,
    this.lastMessageAuthorUid,
    this.lastMessageAt,
  });

  factory ChatThread.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? const <String, dynamic>{};
    return ChatThread(
      id: doc.id,
      participantUids:
          ((d['participantUids'] as List?) ?? const []).cast<String>(),
      participantNames: Map<String, String>.from(
          (d['participantNames'] as Map?) ?? const {}),
      participantRoles: Map<String, String>.from(
          (d['participantRoles'] as Map?) ?? const {}),
      lastMessage: (d['lastMessage'] as String?) ?? '',
      lastMessageAuthorUid: d['lastMessageAuthorUid'] as String?,
      lastMessageAt: (d['lastMessageAt'] as Timestamp?)?.toDate(),
    );
  }

  /// Имя/роль второго участника (того, что не равен myUid).
  String otherName(String myUid) {
    for (final uid in participantUids) {
      if (uid != myUid) return participantNames[uid] ?? 'Unknown';
    }
    return 'Unknown';
  }

  String otherUid(String myUid) {
    for (final uid in participantUids) {
      if (uid != myUid) return uid;
    }
    return '';
  }

  String otherRole(String myUid) {
    final uid = otherUid(myUid);
    return participantRoles[uid] ?? '';
  }
}

class ChatRepository {
  ChatRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;
  CollectionReference<Map<String, dynamic>> get _chats =>
      _db.collection('chats');

  /// Детерминированный id диалога между двумя юзерами.
  /// Сортируем uid'ы — гарантирует, что (A,B) и (B,A) дают один id.
  static String chatIdFor(String uidA, String uidB) {
    final pair = [uidA, uidB]..sort();
    return '${pair[0]}_${pair[1]}';
  }

  /// Все диалоги, в которых участвует данный юзер. Сортировка — последние
  /// активные сверху.
  Stream<List<ChatThread>> watchChatsFor(String uid) {
    return _chats
        .where('participantUids', arrayContains: uid)
        .orderBy('lastMessageAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map(ChatThread.fromDoc).toList());
  }

  /// Сообщения конкретного диалога. Подгружаем последние 100, новые сверху.
  Stream<List<ChatMessage>> watchMessages(String chatId) {
    return _chats
        .doc(chatId)
        .collection('messages')
        .orderBy('sentAt', descending: true)
        .limit(100)
        .snapshots()
        .map((snap) => snap.docs.map(ChatMessage.fromDoc).toList());
  }

  /// Отправить сообщение. Если диалога ещё нет — создаём по дороге.
  /// Сохраняем имена обоих участников в документе диалога, чтобы потом
  /// отображать список без дополнительных запросов.
  Future<void> sendMessage({
    required String myUid,
    required String myName,
    required String myRole,
    required String otherUid,
    required String otherName,
    required String otherRole,
    required String text,
  }) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    final chatId = chatIdFor(myUid, otherUid);
    final chatRef = _chats.doc(chatId);
    final msgRef = chatRef.collection('messages').doc();

    final batch = _db.batch();
    // set с merge — корректно работает и при первом сообщении (создаёт
    // диалог), и при последующих (обновляет lastMessage*).
    batch.set(
      chatRef,
      {
        'participantUids': [myUid, otherUid]..sort(),
        'participantNames': {myUid: myName, otherUid: otherName},
        'participantRoles': {myUid: myRole, otherUid: otherRole},
        'lastMessage': trimmed,
        'lastMessageAuthorUid': myUid,
        'lastMessageAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
    batch.set(msgRef, {
      'authorUid': myUid,
      'authorName': myName,
      'authorRole': myRole,
      'text': trimmed,
      'sentAt': FieldValue.serverTimestamp(),
    });
    await batch.commit();
  }
}
