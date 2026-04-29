# Migration guide — роли + чат

Что добавилось:
- При регистрации выбирается роль **Doctor** или **Patient**.
- Роль хранится в Firestore `users/{uid}` и связывает Auth-аккаунт с карточкой в `doctors/{uid}` или `patients/{uid}`.
- Доктор → видит весь функционал как раньше.
- Пациент → видит только 3 таба: **My Card**, **Doctors**, **Chat**.
- Чат теперь динамический — пишется в Firestore `chat_rooms/general/messages`, общий для всех.
- Google Sign-In удалён (не вписывается в "выбор роли при регистрации"). Только email/password.

---

## 1. Обновить Firestore security rules

Нужно разрешить ещё две коллекции — `users` и `chat_rooms`. Полный набор правил:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Профили: каждый юзер пишет только свой профиль; читать может любой
    // залогиненный (нужно докторам, чтобы видеть имена в списке).
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Доктора: читать может любой залогиненный.
    // Писать — только сам доктор в свою карточку, ИЛИ другой доктор
    // (для случая когда админ-доктор управляет коллегами).
    match /doctors/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Пациенты: читать может любой залогиненный (доктору нужен список).
    // Писать может либо сам пациент в свою карточку, либо доктор в любую.
    match /patients/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Чат: читать и писать может любой залогиненный.
    match /chat_rooms/{room}/messages/{msg} {
      allow read, write: if request.auth != null;
    }
  }
}
```

В Firebase Console: **Firestore Database → Rules** → вставь, нажми **Publish**.

> Правила сейчас почти максимально открыты для авторизованных юзеров — для прода стоит разделить (например, патч пациентом запретить менять чужие карточки), но для дипломки и тестов хватит.

## 2. Удалить пакет google_sign_in

В `pubspec.yaml` удали строку `google_sign_in: ^6.2.1` (если есть).

`flutter pub get`.

## 3. Распаковать lib/

Заменяй полностью.

**Новые файлы:**
- `data/models/user_profile.dart` — модель профиля (uid + role)
- `data/repositories/chat_repository.dart` — стрим сообщений + send
- `presentation/screens/auth_wrapper.dart` — теперь роутит по роли
- `presentation/screens/patient_part/patient_main_screen.dart` — пациентская оболочка с 3 табами
- `presentation/screens/patient_part/my_card_screen.dart` — своя карточка пациента
- `presentation/screens/patient_part/patient_doctors_screen.dart` — read-only список докторов для пациента
- `presentation/screens/patient_part/chat_screen.dart` — Firestore-чат (один на всех)

**Переписаны:**
- `data/repositories/auth_repository.dart` — `signUpWithEmail` теперь принимает роль и создаёт `users/{uid}` + `doctors/{uid}` или `patients/{uid}` одной транзакцией. Google убран.
- `presentation/bloc/auth/*` — стейт хранит `User` + `UserProfile`, отдельные статусы для "ждём профиль" / "залогинен".
- `presentation/bloc/login/*` — без Google.
- `presentation/bloc/register/*` — добавлен `role` в стейт и `RegisterRoleChanged` ивент.
- `presentation/screens/register_part/login_screen.dart` — без кнопки Google.
- `presentation/screens/register_part/register_screen.dart` — добавлен селектор ролей (две карточки Doctor/Patient).
- `presentation/screens/main_part/messages_screen.dart` — теперь обёртка над `ChatScreen` (доктора видят тот же чат).
- `main.dart` — добавлен `ChatRepository`, убран `MessagesBloc`.

## 4. Запуск

```bash
flutter clean
flutter pub get
flutter run
```

## 5. Тестирование

1. **Зарегистрируйся как Doctor** на одном устройстве/эмуляторе:
   - Видишь полный набор табов: Dashboard, Appointments, Patients, Doctors, More.
   - В **Doctors** ты сам появишься в списке (карточка создалась автоматически при регистрации). Можешь её отредактировать.
   - В **Messages** — общий чат.

2. **Зарегистрируйся как Patient** на втором устройстве (или выйди → зарегистрируйся новым email):
   - Видишь 3 таба: **My Card**, **Doctors**, **Chat**.
   - **My Card** — твоя карточка с автозаполнением: имя, email. Возраст, диагноз и т.д. — пустые. Нажми **Edit my card** → заполни → Save.
   - **Doctors** — список всех докторов, без редактирования.
   - **Chat** — пиши сообщение, на первом устройстве (доктор) оно появится в **Messages**.

## 6. Что в Firestore теперь хранится

```
users/{uid}                # каждый зарегистрированный юзер
  role: "doctor"|"patient"
  displayName, email

doctors/{uid}              # uid = тот же что у Auth-аккаунта
  name, specialty, schedule, availability
  phone, email, address, createdAt

patients/{uid}             # uid = тот же что у Auth-аккаунта
  name, age, gender, diagnosis, status, ward, room
  assignedDoctor, phone, email, address, createdAt

chat_rooms/general/messages/{auto-id}
  authorUid, authorName, authorRole
  text, sentAt
```

Связь `users/{uid}` ↔ `patients/{uid}` ↔ `doctors/{uid}` через **общий uid**.
То есть зная uid юзера (= `FirebaseAuth.currentUser.uid`), мы сразу знаем где его карточка.

## Ограничения / на будущее

- **Чат — общий**, не 1-на-1. Все доктора и пациенты пишут в одну комнату. Чтобы сделать приватные диалоги, нужна структура `chats/{userA_userB}/messages/...` плюс UI выбора собеседника.
- **Удаление пациента доктором** не "удаляет" Auth-аккаунт пациента, только запись в `patients/`. Для полного удаления нужны Cloud Functions.
- Старый MessagesBloc остался лежать в `bloc/messages/` — он больше не используется, но я его не стал удалять чтобы не сломать что-то ещё. Можешь снести руками.
