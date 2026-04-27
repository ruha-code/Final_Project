# Firebase setup — пошагово с нуля

У тебя нет Firebase-проекта, поэтому сначала создаём его, потом подключаем к Flutter, потом собираем приложение.

---

## 1. Установить инструменты (один раз, глобально)

```bash
# Node + Firebase CLI (нужен для flutterfire configure)
npm install -g firebase-tools

# FlutterFire CLI — генерирует firebase_options.dart
dart pub global activate flutterfire_cli
```

Убедись, что `$HOME/.pub-cache/bin` есть в `PATH`, иначе команда `flutterfire` не найдётся.

## 2. Создать проект в Firebase Console

1. Открой https://console.firebase.google.com и нажми **Add project**.
2. Назови его, например, `medlink-hospital`. Analytics можно не включать — не нужен.
3. Когда проект создан — в левом меню **Build → Authentication → Get started**.
4. Во вкладке **Sign-in method** включи два провайдера:
   - **Email/Password** → Enable → Save.
   - **Google** → Enable → поставь support email → Save.

Это всё, что нужно в консоли. Остальное настроит FlutterFire CLI.

## 3. Авторизоваться и привязать проект

Из корня твоего Flutter-проекта (рядом с `pubspec.yaml`):

```bash
firebase login           # откроет браузер, войди тем же гуглом, что и в консоли
flutterfire configure    # покажет список проектов — выбери medlink-hospital
```

`flutterfire configure` сам:
- определит платформы (android/ios/web/...),
- зарегистрирует в Firebase по приложению на каждую,
- скачает `google-services.json` → `android/app/`,
- скачает `GoogleService-Info.plist` → `ios/Runner/`,
- сгенерирует `lib/firebase_options.dart` (его импортирует `main.dart`).

Если спросит bundle id / application id — жми Enter, он подхватит из проекта.

## 4. Добавить зависимости

В `pubspec.yaml` в `dependencies:` добавь:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # уже есть в проекте
  flutter_bloc: ^8.1.6
  bloc: ^8.1.4
  meta: ^1.15.0

  # новые:
  firebase_core: ^3.6.0
  firebase_auth: ^5.3.1
  google_sign_in: ^6.2.1
```

Версии указаны минимально совместимые на момент написания. Если `flutter pub get` ругается на конфликт — просто запусти `flutter pub upgrade firebase_core firebase_auth google_sign_in`.

Потом:

```bash
flutter pub get
```

## 5. Android-специфика

### 5.1. `android/app/build.gradle` (или `build.gradle.kts`)

Проверь, что `minSdkVersion` ≥ **23** (нужно firebase_auth). Если меньше — подними:

```gradle
android {
    defaultConfig {
        minSdkVersion 23
        // ...
    }
}
```

### 5.2. Google Sign-In: SHA-1

Google Sign-In на Android **не будет работать**, пока ты не добавишь отпечаток SHA-1 debug-ключа в Firebase.

Получить SHA-1:

```bash
cd android
./gradlew signingReport
```

(на macOS/Linux; на Windows: `gradlew signingReport`)

В выводе найди блок **Variant: debug** → строку `SHA1:` → скопируй хеш.

Потом в Firebase Console:
- **Project settings** (шестерёнка) → **Your apps** → Android app →
- **Add fingerprint** → вставь SHA-1 → Save.
- Скачай обновлённый `google-services.json` и положи обратно в `android/app/`
  (или просто запусти `flutterfire configure` ещё раз — он сделает это сам).

Для релиза тем же способом добавь SHA-1 релизного keystore.

## 6. iOS-специфика (если собираешь под iOS)

### 6.1. REVERSED_CLIENT_ID в Info.plist

Открой `ios/Runner/GoogleService-Info.plist`, найди значение `REVERSED_CLIENT_ID` (выглядит как `com.googleusercontent.apps.1234567890-abcdef`).

Добавь его в `ios/Runner/Info.plist` как URL Scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <!-- сюда вставь REVERSED_CLIENT_ID -->
      <string>com.googleusercontent.apps.XXXXXXXXXX-XXXXXXX</string>
    </array>
  </dict>
</array>
```

### 6.2. Podfile

В `ios/Podfile` платформа должна быть **iOS 13** или выше:

```ruby
platform :ios, '13.0'
```

Потом:

```bash
cd ios && pod install && cd ..
```

## 7. Заменить код

Распакуй присланный `lib/` поверх существующего — я сохранил всю структуру, только добавил/переписал нужные файлы:

**Новые файлы:**
- `lib/features/data/repositories/auth_repository.dart` — обёртка над FirebaseAuth+GoogleSignIn
- `lib/features/presentation/bloc/auth/auth_bloc.dart` (+ event + state) — глобальный auth-стейт
- `lib/features/presentation/screens/auth_wrapper.dart` — роутит между Login/Main по auth-стейту

**Переписаны:**
- `lib/main.dart` — вызов `Firebase.initializeApp`, RepositoryProvider, AuthBloc, `home: AuthWrapper()`
- `lib/features/presentation/bloc/login/*` — async логин через email/password + Google
- `lib/features/presentation/bloc/register/*` — async регистрация + Google
- `lib/features/presentation/screens/register_part/login_screen.dart` — Username → Email, кнопка Google, SnackBar ошибок, спиннер
- `lib/features/presentation/screens/register_part/register_screen.dart` — поле Full name → displayName, кнопка Google
- `lib/features/presentation/screens/main_part/profile_screen.dart` — имя/email/аватар из Firebase, Logout через AuthBloc
- `lib/features/presentation/screens/main_part/more_screen.dart` — карточка профиля из Firebase
- `lib/features/presentation/screens/main_part/dashboard_screen.dart` — "Hello {имя}" из displayName

## 8. Запуск

```bash
flutter clean
flutter pub get
flutter run
```

При первом входе Login/Register теперь реально создают аккаунт в Firebase — можешь открыть **Authentication → Users** в консоли и видеть созданных юзеров.

---

## Что делает каждый кусок

- **AuthRepository** — единственное место, которое знает про `FirebaseAuth` и `GoogleSignIn`. Остальной код ходит только через него.
- **AuthBloc** — подписан на `FirebaseAuth.userChanges()`. Когда Firebase говорит "залогинен / разлогинен / изменился профиль" — эмитит `AuthState`.
- **AuthWrapper** — смотрит на `AuthBloc` и возвращает или `LoginScreen`, или `MainScreen`. Больше никаких `Navigator.pushReplacementNamed('/dashboard')` в login_screen — логика одна: сменилось auth-состояние → swap корневого экрана.
- **LoginBloc / RegisterBloc** — обрабатывают конкретную форму: показывают лоадер, валидируют поля, мапят `FirebaseAuthException.code` в человеческий текст, кидают SnackBar. Успех они тоже эмитят, но навигацию делать не надо — AuthWrapper справится сам, когда Firebase-стрим отыграет.

## Типичные проблемы

| Симптом | Что чинить |
|---|---|
| `MissingPluginException(No implementation found for method signInWithEmail...)` | Забыл `flutter clean` + полную пересборку после добавления плагинов |
| Google Sign-In: `PlatformException(sign_in_failed, ..., ApiException: 10, ...)` | SHA-1 не добавлен в Firebase (п. 5.2) или `google-services.json` устарел — перезапусти `flutterfire configure` |
| `[firebase_core/no-app] No Firebase App ...` | Не вызвал `await Firebase.initializeApp()` до `runApp` (в `main.dart` он уже есть — проверь, что ты не потерял `WidgetsFlutterBinding.ensureInitialized()`) |
| iOS крашится при нажатии "Continue with Google" | Не добавлен `REVERSED_CLIENT_ID` в `Info.plist` (п. 6.1) |
| После логаута экран профиля остаётся на экране | Навигатор не попнул стек — проверь, что `AuthWrapper` не обёрнут во что-то, ломающее `Navigator.of(context)` |
