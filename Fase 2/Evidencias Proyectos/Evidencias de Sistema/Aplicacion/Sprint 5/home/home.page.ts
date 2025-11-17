// Importaciones principales de Angular, Ionic y módulos comunes
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';

// Importación del servicio de autenticación
import { AuthService } from '../services/auth.service';

// Modal de dashboard financiero
import { DashboardModalComponent } from '../components/dashboard-modal/dashboard-modal.component';

// Módulo para gráficos (para futuros dashboards visuales con ngx-charts)
import { NgxChartsModule } from '@swimlane/ngx-charts';

/**
 * Página principal (Home) de la aplicación.
 * Muestra accesos rápidos, botones de navegación y dashboard resumen en modal.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, NgxChartsModule]
})
export class HomePage implements OnInit {

  // Rol del usuario autenticado para controlar vistas o funciones (admin/standard)
  role: 'admin' | 'standard' | null = null;

  /**
   * Inyección de dependencias estándar usando el constructor
   * @param router - Servicio de rutas para navegación Angular
   * @param authService - Servicio que maneja la autenticación y la sesión de usuario
   * @param modalController - Controlador para abrir/cerrar modals en Ionic
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  /**
   * Hook de inicialización de Angular
   * Escucha cambios en el usuario autenticado y determina su rol
   */
  ngOnInit() {
    this.authService.appUser$.subscribe(user => {
      if (user) {
        this.role = user.rol;  // Asigna el rol al atributo local
        console.log('ROL DEL USUARIO:', this.role); // Debug por consola
      } else {
        this.role = null;
      }
    });
  }

  /**
   * Navega a cualquier ruta de la aplicación según el path recibido
   * Usado para botones de acceso rápido en la interfaz de Home
   * @param path - Cadena con la ruta Angular
   */
  goTo(path: string) {
    this.router.navigate([path]);
  }

  /**
   * Abre el modal del dashboard financiero
   * Usa el componente DashboardModalComponent
   */
  async openDashboard() {
    const modal = await this.modalController.create({
      component: DashboardModalComponent,
    });
    await modal.present();
  }

  /**
   * Cierra la sesión del usuario autenticado
   * No redirige manualmente; se espera que la UX global responda al cambio de sesión (por guards o listeners)
   */
  async logout() {
    await this.authService.logout();
  }
}
