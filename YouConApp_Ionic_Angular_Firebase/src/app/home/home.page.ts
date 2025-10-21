import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DashboardModalComponent } from '../components/dashboard-modal/dashboard-modal.component';
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Importante para los gráficos


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, NgxChartsModule] // Añade NgxChartsModule aquí
})
export class HomePage {

  constructor(
    private router: Router,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  // Navega a la página seleccionada
  goTo(path: string) {
    this.router.navigate([path]);
  }

  // Abre el modal del dashboard
  async openDashboard() {
    const modal = await this.modalController.create({
      component: DashboardModalComponent,
    });
    await modal.present();
  }

  // Cierra la sesión del usuario
  async logout() {
    await this.authService.logout();
  }
}