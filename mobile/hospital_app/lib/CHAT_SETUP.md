# Migration — 1-to-1 chats

Общий чат `chat_rooms/general` заменён на приватные диалоги между двумя юзерами.

## 1. Обновить security rules

В Firestore Console → Rules. **Старое правило** для `chat_rooms` можно удалить (коллекция останется в БД, но больше не используется — потом руками удалишь). Добавь правила для `chats`:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /doctors/{uid} {
      allow read, write: if request.auth != null;
    }
    match /patients/{uid} {
      allow read, write: if request.auth != null;
    }
    match /availability_slots/{id} {
      allow read, write: if request.auth != null;
    }
    match /appointments/{id} {
      allow read, write: if request.auth != null;
    }

    // 1-to-1 чаты. Читать/писать может только участник диалога.
    match /chats/{chatId} {
      allow read, write: if request.auth != null
                         && request.auth.uid in resource.data.participantUids;
      // Для create — данные ещё не существуют в resource.data, проверяем
      // request.resource.
      allow create: if request.auth != null
                    && request.auth.uid in request.resource.data.participantUids;

      match /messages/{msgId} {
        // Сообщения могут читать/писать оба участника родительского чата.
        allow read, write: if request.auth != null
                           && request.auth.uid in
                              get(/databases/$(database)/documents/chats/$(chatId)).data.participantUids;
      }
    }
  }
}
```

Publish.

> Если не хочешь морочиться с строгими правилами на этапе разработки — используй упрощённый вариант (любой залогиненный читает/пишет всё):
> ```js
> match /chats/{chatId} {
>   allow read, write: if request.auth != null;
>   match /messages/{msgId} {
>     allow read, write: if request.auth != null;
>   }
> }
> ```

## 2. Composite index для списка чатов

Когда впервые откроешь Chats — Firestore попросит индекс на `participantUids` (arrayContains) + `lastMessageAt` (desc). В DEBUG CONSOLE будет ссылка вида:
`https://console.firebase.google.com/.../indexes?create_composite=...`
Открой → Create.

## 3. Распакуй lib/

**Новые файлы:**
- `data/repositories/chat_repository.dart` — переписан под 1-to-1 (старый удалён)
- `presentation/screens/chat_part/chat_list_screen.dart` — список диалогов
- `presentation/screens/chat_part/chat_room_screen.dart` — конкретный диалог
- `presentation/screens/chat_part/new_chat_screen.dart` — выбор собеседника

**Изменены:**
- `data/repositories/auth_repository.dart` — добавлены `watchUsersByRole()` и `watchAllUsers()`
- `presentation/screens/patient_part/patient_main_screen.dart` — таб "Chat" теперь открывает `ChatListScreen`
- `presentation/screens/main_part/messages_screen.dart` — то же самое для доктора

**Удалено:**
- `presentation/screens/patient_part/chat_screen.dart` (старый общий чат)

## 4. flutter clean && flutter run

## 5. Тест

1. Войди как доктор. Перейди в **More → Messages**. Список пуст.
2. Жми **+** (FAB) → видишь список **всех** юзеров (доктора и пациенты).
3. Тапни на пациента → открылся чат → напиши "Hello".
4. Logout → Login как этот пациент.
5. **Chats tab** — видишь диалог с доктором, последним сообщением, временем.
6. Тапни → ответь "Hi back".
7. Жми **+** в списке диалогов пациента → видишь **только докторов** (других пациентов нет).
8. Открой второй существующий диалог → не дублируется, тот же `chatId`.

## Структура коллекций

```
chats/{chatId}                            chatId = "{uidA}_{uidB}" sorted
  participantUids: [uidA, uidB]
  participantNames: { uidA: "Dr. Hart", uidB: "Mark Otv" }
  participantRoles: { uidA: "doctor", uidB: "patient" }
  lastMessage: "Hi back"
  lastMessageAuthorUid: uidB
  lastMessageAt: <timestamp>

chats/{chatId}/messages/{auto-id}
  authorUid, authorName, authorRole
  text, sentAt
```

ChatId детерминирован: `{сорт_uid_A}_{сорт_uid_B}`. Поэтому повторное открытие чата с тем же юзером не создаёт второй документ.

## Удалить старый общий чат (необязательно)

Старая коллекция `chat_rooms/general/messages` останется в Firestore. Это нормально — кода обращений к ней нет. Хочешь — удали в Firebase Console:
**Firestore Database → Data → chat_rooms → … → Delete collection**.
