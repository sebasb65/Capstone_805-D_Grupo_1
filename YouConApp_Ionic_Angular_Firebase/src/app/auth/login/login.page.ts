// Importaciones necesarias de Angular Core
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

// Importaciones de componentes y controladores de Ionic
import { AlertController, LoadingController, ToastController, IonicModule } from '@ionic/angular';

// Servicio de autenticación personalizado
import { AuthService } from '../../services/auth.service';

// Módulos de Angular para funcionalidades comunes y formularios
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Componente de página de inicio de sesión
 * Maneja la autenticación de usuarios y recuperación de contraseña
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true, // Componente standalone (no requiere módulo)
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
  host: {
    class: 'center-content' // Clase CSS para centrar el contenido en la página
  }
})
export class LoginPage {
  // Objeto que almacena las credenciales del usuario (email y contraseña)
  credentials = { email: '', password: '' };

  /**
   * Constructor del componente
   * @param authService - Servicio de autenticación para manejar login y recuperación
   * @param loadingController - Controlador para mostrar indicadores de carga
   * @param toastController - Controlador para mostrar mensajes toast
   * @param alertController - Controlador para mostrar alertas/diálogos
   */
  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  /**
   * Maneja el proceso de inicio de sesión
   * Muestra un indicador de carga mientras se procesa la autenticación
   * Muestra mensajes de error si la autenticación falla
   */
  async handleLogin() {
    // Crea y muestra el indicador de carga
    const loading = await this.loadingController.create({ message: 'Iniciando sesión...' });
    await loading.present();

    // Intenta iniciar sesión con las credenciales proporcionadas
    this.authService.login(this.credentials)
      .catch(error => {
        // Si hay error, muestra un mensaje toast con el error traducido
        this.presentToast(this.authService.getFirebaseErrorMessage(error.code), 'danger');
      })
      .finally(() => {
        // Siempre cierra el indicador de carga al finalizar (éxito o error)
        loading.dismiss();
      });
  }

  /**
   * Maneja el proceso de recuperación de contraseña
   * Muestra un diálogo para que el usuario ingrese su email
   * Envía un correo de recuperación si el email es válido
   */
  async handlePasswordReset() {
    // Crea una alerta con un campo de entrada para el email
    const alert = await this.alertController.create({
      header: 'Restablecer Contraseña',
      message: 'Ingresa tu correo y te enviaremos un enlace.',
      inputs: [{ type: 'email', name: 'email', placeholder: 'tu@correo.com' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar la operación
        {
          text: 'Enviar',
          handler: async (data) => {
            // Valida que se haya ingresado un email
            if (!data.email) return;
            
            // Intenta enviar el correo de recuperación
            await this.authService.resetPassword(data.email)
              .then(() => this.presentToast('Correo enviado.', 'success')) // Éxito
              .catch(error => this.presentToast(this.authService.getFirebaseErrorMessage(error.code), 'danger')); // Error
          }
        }
      ]
    });
    // Muestra el diálogo
    await alert.present();
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
