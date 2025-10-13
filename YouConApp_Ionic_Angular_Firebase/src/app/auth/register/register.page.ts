import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // <-- 1. Importa RouterLink aquí
import { LoadingController, ToastController, IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
  host: {
    class: 'center-content' // <-- AÑADE ESTO
  } // <-- 2. Añádelo aquí
})
export class RegisterPage {
  credentials = { email: '', password: '' };

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  async handleRegister() {
    const loading = await this.loadingController.create({ message: 'Creando cuenta...' });
    await loading.present();

    this.authService.register(this.credentials)
      .then(() => {
        // La navegación global se encargará
      })
      .catch(error => {
        this.presentToast(this.authService.getFirebaseErrorMessage(error.code), 'danger');
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}