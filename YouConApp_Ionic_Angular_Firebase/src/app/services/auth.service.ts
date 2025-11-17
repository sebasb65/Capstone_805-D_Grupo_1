// Importaciones de Angular
import { Injectable } from '@angular/core';

// Importaciones de Firebase Auth para manejo de autenticación
import { 
  Auth, 
  user, 
  authState, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut 
} from '@angular/fire/auth';

// RxJS para manejo y transformación reactiva de datos
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Importaciones de Firestore para interacción con datos de perfil de usuario, consulta y escritura
import { 
  Firestore, 
  doc, 
  setDoc,
  docData,
  collection,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

/**
 * Servicio de autenticación y gestión de usuario.
 * Centraliza login, registro, gestión del perfil y reseteo/cierre de sesión.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /** 
   * Observable reactivo al estado global de la autenticación de Firebase.
   * Se actualiza en tiempo real al login/logout/cambio de sesión.
   */
  public readonly authState$ = authState(this.auth);

  /**
   * Observable reactivo al usuario autenticado (cuenta de Firebase).
   */
  public readonly user$ = user(this.auth);

  /**
   * Observable reactivo a los datos del usuario en la colección 'usuarios' de Firestore.
   * Si no hay usuario autenticado, emite null.
   * Si hay usuario autenticado, retorna los datos de su documento de perfil.
   */
  public readonly appUser$: Observable<any> = this.user$.pipe(
    switchMap((fbUser) => {
      if (!fbUser) return of(null); // Si está deslogueado
      const ref = doc(this.firestore, `usuarios/${fbUser.uid}`);
      return docData(ref); // Datos reactivos del perfil extendido del usuario
    })
  );

  /**
   * Constructor con inyección de dependencias
   * @param auth - Servicio de Auth de Firebase (proporcionado por AngularFire)
   * @param firestore - Servicio de Firestore para acceso a datos extra de usuarios
   */
  constructor(
    public auth: Auth,
    private firestore: Firestore
  ) { }

  /**
   * Registra un nuevo usuario.
   * - Convierte email a minúsculas y elimina espacios.
   * - Si el email ya existe como supervisor, lo registra como 'standard' y asigna adminUid.
   * - Si no, lo deja como 'admin'.
   * - Crea el documento del usuario en Firestore.
   * @param email - Correo del usuario
   * @param password - Contraseña
   * @param rol - Rol explícito, por defecto 'admin'
   */
  register({ email, password, rol = 'admin' }: { email: string; password: string; rol?: 'admin' | 'standard'; }) {
    const emailLower = email.toLowerCase().trim();

    return createUserWithEmailAndPassword(this.auth, emailLower, password)
      .then(async (cred) => {
        const uid = cred.user.uid;

        // Verifica si el usuario es supervisor de algún admin para asignar rol 'standard'
        const supervisoresRef = collection(this.firestore, 'supervisores');
        const q = query(supervisoresRef, where('email', '==', emailLower));
        const snap = await getDocs(q);

        let finalRol: 'admin' | 'standard' = rol;
        let adminUid: string | null = null;

        if (!snap.empty) {
          // Si está en supervisores, lo registra como standard y le asigna adminUid
          const supData: any = snap.docs[0].data();
          finalRol = 'standard';
          adminUid = supData.adminUid || null;
        }

        // Crea o sobreescribe el documento de usuario en la colección usuarios
        const userRef = doc(this.firestore, `usuarios/${uid}`);

        await setDoc(userRef, {
          uid,
          email: cred.user.email,
          rol: finalRol,    
          adminUid: adminUid ?? null,
          createdAt: new Date()
        });

        return cred;
      });
  }

  /**
   * Inicia sesión con email y contraseña
   * @param email - Email del usuario
   * @param password - Contraseña
   * @returns Promise con usuario autenticado o error
   */
  login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Envía un mail de recuperación de contraseña usando Firebase
   * @param email - Email al que se enviará el correo
   * @returns Promise<void>
   */
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Cierra sesión del usuario actual
   * @returns Promise<void>
   */
  logout() {
    return signOut(this.auth);
  }

  /**
   * Traduce los códigos de error de Firebase Auth a mensajes amigables para el usuario final
   * @param errorCode - Código de error de Firebase Auth
   * @returns mensaje traducido y comprensible
   */
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
