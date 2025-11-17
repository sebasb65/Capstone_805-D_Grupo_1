// Importaciones necesarias de Angular, Ionic y servicios propios/autenticación
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth'; // Tipo de usuario de Firebase Auth
import { Router } from '@angular/router';

/**
 * Componente de la página de perfil de usuario
 * Permite ver información, cambiar contraseña y cerrar sesión
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProfilePage implements OnInit {

  // Usuario autenticado actual (null si no hay sesión)
  public currentUser: User | null = null;

  // Inyección de servicios usando el patrón moderno Angular
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  constructor() { }

  /**
   * Hook de inicialización; suscribe al observable de usuario
   * Se mantiene reactivo ante cambios en la sesión/auth
   */
  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Dispara el flujo de cambio de contraseña mediante correo de recupero
   * Abre un alert pidiendo confirmación y luego usa Firebase para enviar el mail
   */
  async changePassword() {
    // Valida que exista email en el usuario actual
    if (!this.currentUser?.email) {
      this.presentToast('No se pudo encontrar tu correo electrónico.', 'danger');
      return;
    }

    // Crea el alert explicativo y de confirmación
    const alert = await this.alertCtrl.create({
      header: 'Cambiar Contraseña',
      message: `Se enviará un correo a ${this.currentUser.email} con las instrucciones para restablecer tu contraseña. ¿Deseas continuar?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar
        {
          text: 'Enviar',
          handler: async () => {
            try {
              // Llama al método para enviar el mail de reseteo de contraseña
              await this.authService.resetPassword(this.currentUser!.email!);
              this.presentToast('Correo enviado. Revisa tu bandeja de entrada.', 'success');
            } catch (error) {
              this.presentToast('Error al enviar el correo.', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /**
   * Cierra sesión y navega al login, mostrando toast de confirmación
   */
  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    this.presentToast('Has cerrado sesión.', 'success');
  }

  /**
   * Muestra mensajes toast para feedback visual en pantalla
   * @param message - Mensaje de texto a mostrar
   * @param color - Color del toast ('success' = verde, 'danger' = rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }
}
