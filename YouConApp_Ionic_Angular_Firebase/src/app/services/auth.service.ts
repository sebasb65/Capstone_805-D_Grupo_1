import { Injectable } from '@angular/core';
import { Auth, user, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public readonly authState$ = authState(this.auth);
  public readonly user$ = user(this.auth);

  constructor(public auth: Auth) { }

  register({ email, password }: any) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  logout() {
    return signOut(this.auth);
  }

  getFirebaseErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email': return 'El formato del correo es inválido.';
      case 'auth/user-not-found': return 'No se encontró un usuario con este correo.';
      case 'auth/wrong-password': return 'La contraseña es incorrecta.';
      case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/missing-password': return 'La contraseña no puede estar vacía.';
      case 'auth/invalid-credential': return 'Las credenciales proporcionadas son incorrectas.';
      default: return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    }
  }
}