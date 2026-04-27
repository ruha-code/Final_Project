# Firestore setup — пошагово

В прошлый раз ты включил Authentication. Теперь нужно включить Firestore — туда будем класть докторов и пациентов.

---

## 1. Включить Firestore в консоли

1. https://console.firebase.google.com → выбираешь свой проект **hospital-app**.
2. Слева: **Build → Firestore Database**.
3. Нажми **Create database**.
4. **Location**: выбери ближайший регион (например, `eur3` (europe-west) или `asia-southeast1`). **ВАЖНО:** регион нельзя поменять потом, только удалив базу.
5. **Start in production mode** → Next → Enable.

База создана, но пустая. Коллекции `doctors` и `patients` появятся автоматически, как только ты добавишь первого доктора/пациента из приложения.

## 2. Настроить security rules

Сейчас правила запрещают всё. Нужно разрешить чтение/запись авторизованным пользователям.

В консоли: **Firestore Database → Rules**, замени всё на:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Любой залогиненный юзер может читать и писать в коллекции
    // doctors и patients. Для прода стоит ограничить write только админам,
    // но для разработки этого достаточно.
    match /doctors/{doc} {
      allow read, write: if request.auth != null;
    }
    match /patients/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Нажми **Publish**.

## 3. Добавить зависимость

В `pubspec.yaml` добавь к существующим Firebase-пакетам:

```yaml
dependencies:
  # уже добавлены ранее:
  firebase_core: ^3.6.0
  firebase_auth: ^5.3.1
  google_sign_in: ^6.2.1

  # новое:
  cloud_firestore: ^5.4.4
```

Затем:

```bash
flutter pub get
```

## 4. Заменить код

Распакуй присланный `lib/` поверх существующего. Новые/обновлённые файлы:

**Новое:**
- `lib/features/data/models/_avatar_style.dart` — генерация инициалов и цветов из имени
- `lib/features/data/models/doctor.dart` — модель + Firestore (де)сериализация
- `lib/features/data/models/patient.dart` — то же для пациентов
- `lib/features/data/repositories/doctor_repository.dart` — CRUD + watchAll-стрим
- `lib/features/data/repositories/patient_repository.dart` — то же
- `lib/features/presentation/screens/main_part/doctor_edit_screen.dart` — форма add/edit
- `lib/features/presentation/screens/main_part/patient_edit_screen.dart` — форма add/edit

**Переписано:**
- `lib/main.dart` — добавлены DoctorRepository, PatientRepository в провайдеры
- `lib/features/presentation/bloc/doctor/*` — теперь подписан на стрим Firestore
- `lib/features/presentation/bloc/patient/*` — то же
- `lib/features/presentation/screens/main_part/doctors_screen.dart` — список из BLoC, FAB → DoctorEditScreen, состояния loading/empty/error
- `lib/features/presentation/screens/main_part/patients_screen.dart` — то же
- `lib/features/presentation/screens/main_part/doctor_detail_screen.dart` — принимает `Doctor`-модель, кнопки Edit/Delete в верхней панели
- `lib/features/presentation/screens/main_part/patient_detail_screen.dart` — принимает `Patient`-модель, Edit/Delete
- `lib/features/presentation/screens/main_part/widgets/patient_card.dart` — мелкая правка (heightCm убрали из текста)

## 5. Запуск

```bash
flutter clean
flutter pub get
flutter run
```

Откроется приложение. Зайди как обычно (Email/Google) → таб **Doctors** или **Patients** → жми **+** → заполни форму → Create. В Firestore Console сразу увидишь новый документ.

---

## Что внутри происходит

### Поток данных

```
DoctorEditScreen ─add()/update()─▶ DoctorRepository ─▶ Firestore
                                                          │
                                                          ▼ snapshots
DoctorsScreen ◀── BlocBuilder ── DoctorBloc ◀── watchAll() стрим
```

После любой записи Firestore сам шлёт обновление через стрим — UI перерисовывается без всяких "перезагрузить". В этом весь смысл: список **живой**, никаких вызовов "refresh".

### Что хранится в Firestore

Каждый доктор — документ в `doctors/{auto-id}` с полями:
```
name: "Dr. Amelia Hart"
specialty: "Cardiology"
schedule: "Mon-Fri 08:00-16:00"
availability: "Available"
phone: "+7 700 ..."
email: "amelia@medlink.com"
address: "Almaty, Kazakhstan"
createdAt: <timestamp>
```

Каждый пациент — документ в `patients/{auto-id}` с полями:
```
name: "Alicia Perth"
age: 34
gender: "Female"
diagnosis: "Hypertension"
status: "Stable"
ward: "Outpatient"
room: ""                  (пустая строка для Outpatient)
assignedDoctor: "Dr. Amelia Hart"
phone, email, address...
createdAt: <timestamp>
```

### Что НЕ хранится

`initials`, `avatarColor`, `availabilityColor`, `statusColor` — считаются на клиенте детерминированно из имени и статуса. Хранить смысла нет.

`rating`, `experience`, `bloodType`, `weight`, `bloodSugar`, `temperature`, `BP chart` — это декоративные поля на детальном экране. Я оставил их с фиксированными значениями ("заглушками"), так как ты просил только базовые поля + контакты.

## Типичные проблемы

| Симптом | Что чинить |
|---|---|
| `[cloud_firestore/permission-denied]` | Не опубликовал security rules (п. 2) или rules слишком строгие — нужен `request.auth != null` |
| Список пустой, спиннер бесконечно | Firestore не включён в этом проекте (п. 1) или нет интернета. Открой DevTools — увидишь конкретную ошибку |
| `[cloud_firestore/failed-precondition] requires an index` | Не должен сюда залететь, я использую только `orderBy('name')`. Если всё-таки да — Firebase в логе даст ссылку, которая создаст индекс одним кликом |
| Изменил доктора в Firestore Console — в app не обновляется | Не должно быть — если воспроизводится, значит `watchAll()` стрим где-то закрылся; проверь, что `DoctorBloc.close()` не вызывается лишний раз |
