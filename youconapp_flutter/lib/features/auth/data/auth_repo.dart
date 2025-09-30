import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final firebaseAuthProvider = Provider<FirebaseAuth>((_) => FirebaseAuth.instance);

final authStateChangesProvider = StreamProvider<User?>((ref) {
  return ref.watch(firebaseAuthProvider).authStateChanges();
});

final isLoggedInProvider = Provider<bool>((ref) {
  final user = ref.watch(authStateChangesProvider).valueOrNull;
  return user != null;
});

class AuthRepo {
  AuthRepo(this._auth);
  final FirebaseAuth _auth;

  Future<void> signIn(String email, String password) async {
    await _auth.signInWithEmailAndPassword(email: email.trim(), password: password);
  }
  Future<void> signUp(String email, String password) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    // Opcional: enviar verificación de correo
    await cred.user?.sendEmailVerification();
  }

  Future<void> sendPasswordReset(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  Future<void> signOut() => _auth.signOut();
}

final authRepoProvider = Provider<AuthRepo>((ref) {
  return AuthRepo(ref.watch(firebaseAuthProvider));
});
