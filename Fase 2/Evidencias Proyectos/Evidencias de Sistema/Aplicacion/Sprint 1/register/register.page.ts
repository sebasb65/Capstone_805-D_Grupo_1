// Importaciones necesarias de Angular Core
import { Component } from '@angular/core';
// Router para navegación y RouterLink para enlaces en el template
import { Router, RouterLink } from '@angular/router';

// Importaciones de componentes y controladores de Ionic
import { LoadingController, ToastController, IonicModule } from '@ionic/angular';

// Servicio de autenticación personalizado
import { AuthService } from '../../services/auth.service';

// Módulos de Angular para funcionalidades comunes y formularios
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Componente de página de registro de usuarios
 * Permite crear nuevas cuentas en la aplicación
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true, // Componente standalone (no requiere módulo)
  imports: [IonicModule, CommonModule, FormsModule, RouterLink], // Módulos necesarios
  host: {
    class: 'center-content' // Clase CSS para centrar el contenido en la página
  }
})
export class RegisterPage {
  // Objeto que almacena las credenciales del nuevo usuario (email y contraseña)
  credentials = { email: '', password: '' };

  /**
   * Constructor del componente
   * @param authService - Servicio de autenticación para manejar el registro
   * @param router - Servicio de navegación entre páginas
   * @param loadingController - Controlador para mostrar indicadores de carga
   * @param toastController - Controlador para mostrar mensajes toast
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  /**
   * Maneja el proceso de registro de un nuevo usuario
   * Muestra un indicador de carga mientras se crea la cuenta
   * La navegación después del registro se maneja automáticamente por el listener global
   */
  async handleRegister() {
    // Crea y muestra el indicador de carga
    const loading = await this.loadingController.create({ message: 'Creando cuenta...' });
    await loading.present();

    // Intenta registrar al usuario con las credenciales proporcionadas
    this.authService.register(this.credentials)
      .then(() => {
        // El listener global de autenticación (authStateListener) se encarga de la navegación
        // No se requiere navegación manual aquí
      })
      .catch(error => {
        // Si hay error, muestra un mensaje toast con el error traducido de Firebase
        this.presentToast(this.authService.getFirebaseErrorMessage(error.code), 'danger');
      })
      .finally(() => {
        // Siempre cierra el indicador de carga al finalizar (éxito o error)
        loading.dismiss();
      });
  }

  /**
   * Muestra un mensaje toast en la pantalla
   * @param message - Texto del mensaje a mostrar
   * @param color - Color del toast ('success' para verde, 'danger' para rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    // Crea el toast con duración de 3 segundos en la parte superior
    const toast = await this.toastController.create({ 
      message, 
      duration: 3000, 
      color, 
      position: 'top' 
    });
    // Muestra el toast
    await toast.present();
  }
}
