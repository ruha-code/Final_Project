import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Единая точка доступа ко всей auth-логике: email/password + Google Sign-In.
///
/// Экраны и Bloc'и не трогают `FirebaseAuth` напрямую — только через этот класс.
class AuthRepository {
  AuthRepository({FirebaseAuth? firebaseAuth, GoogleSignIn? googleSignIn})
      : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  /// Поток auth-состояния пользователя. Null = вышел из аккаунта.
  ///
  /// Используем [userChanges] вместо [authStateChanges]: первый дополнительно
  /// эмитит при обновлении профиля (например, после updateDisplayName сразу
  /// после регистрации), поэтому UI видит свежее имя без ручного рефреша.
  Stream<User?> get user => _firebaseAuth.userChanges();

  /// Синхронный геттер для текущего пользователя (удобно в UI).
  User? get currentUser => _firebaseAuth.currentUser;

  /// Вход по email/password. Бросает [FirebaseAuthException] при ошибке.
  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    await _firebaseAuth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  /// Регистрация. После создания аккаунта сразу ставит displayName.
  Future<void> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final cred = await _firebaseAuth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await cred.user?.updateDisplayName(displayName.trim());
    await cred.user?.reload();
  }

  /// Вход через Google.
  ///
  /// Возвращает `true` если пользователь успешно вошёл, `false` если отменил
  /// выбор аккаунта (например, закрыл модалку) — это не ошибка, просто отмена.
  Future<bool> signInWithGoogle() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return false; // отмена со стороны пользователя

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    await _firebaseAuth.signInWithCredential(credential);
    return true;
  }

  /// Выход. Выходим и из Firebase, и из Google, чтобы в следующий раз
  /// показывался выбор аккаунта.
  Future<void> signOut() async {
    await Future.wait([
      _firebaseAuth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }
}
