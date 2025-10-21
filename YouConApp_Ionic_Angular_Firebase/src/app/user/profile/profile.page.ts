import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProfilePage implements OnInit {

  public currentUser: User | null = null;
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  constructor() { }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  async changePassword() {
    if (!this.currentUser?.email) {
      this.presentToast('No se pudo encontrar tu correo electrónico.', 'danger');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Cambiar Contraseña',
      message: `Se enviará un correo a ${this.currentUser.email} con las instrucciones para restablecer tu contraseña. ¿Deseas continuar?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async () => {
            try {
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

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    this.presentToast('Has cerrado sesión.', 'success');
  }

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