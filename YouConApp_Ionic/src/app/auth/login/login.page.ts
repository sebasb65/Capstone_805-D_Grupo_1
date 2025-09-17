import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertController, LoadingController, ToastController, IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
  host: {
    class: 'center-content' // <-- AÑADE ESTO
  }
})
export class LoginPage {
  credentials = { email: '', password: '' };

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  async handleLogin() {
    const loading = await this.loadingController.create({ message: 'Iniciando sesión...' });
    await loading.present();

    this.authService.login(this.credentials)
      .catch(error => {
        this.presentToast(this.authService.getFirebaseErrorMessage(error.code), 'danger');
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  async handlePasswordReset() {
    const alert = await this.alertController.create({
      header: 'Restablecer Contraseña',
      message: 'Ingresa tu correo y te enviaremos un enlace.',
      inputs: [{ type: 'email', name: 'email', placeholder: 'tu@correo.com' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (!data.email) return;
            await this.authService.resetPassword(data.email)
              .then(() => this.presentToast('Correo enviado.', 'success'))
              .catch(error => this.presentToast(this.authService.getFirebaseErrorMessage(error.code), 'danger'));
          }
        }
      ]
    });
    await alert.present();
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}