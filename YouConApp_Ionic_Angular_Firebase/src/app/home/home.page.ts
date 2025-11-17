// Importaciones base de Angular y plugins principales
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';

// Servicio de autenticación (gestión de sesión y roles)
import { AuthService } from '../services/auth.service';

// Modal que muestra el dashboard financiero/resumen general
import { DashboardModalComponent } from '../components/dashboard-modal/dashboard-modal.component';

// Módulo para visualización de gráficos (ngx-charts)
import { NgxChartsModule } from '@swimlane/ngx-charts';

/**
 * Página principal de la aplicación después del login.
 * Visual diferente según rol (admin/standard) y acceso a dashboard en modal.
 * Contiene navegación centralizada a los diferentes módulos de la app.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, NgxChartsModule]
})
export class HomePage implements OnInit {

  // Rol del usuario cargado ('admin', 'standard' o null si no está logueado)
  role: 'admin' | 'standard' | null = null;

  /**
   * Constructor con inyección de dependencias estándar.
   * @param router - Para navegar a otras rutas de la app.
   * @param authService - Servicio para leer usuario autenticado y su rol.
   * @param modalController - Controlador para mostrar el modal de dashboard.
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  /**
   * Al inicializar:
   * - Se suscribe a appUser$ para obtener los datos completos del usuario actual.
   * - Actualiza el rol, lo que puede modificar la vista/menú dinámico de la Home.
   */
  ngOnInit() {
    this.authService.appUser$.subscribe(user => {
      if (user) {
        this.role = user.rol;
        console.log('ROL DEL USUARIO:', this.role); // Dev/debug: muestra el rol en consola.
      } else {
        this.role = null;
      }
    });
  }

  /**
   * Función de navegación simple y reutilizable.
   * Dirige la app a cualquier módulo basado solo en el string de ruta.
   * @param path - Ruta relativa destino (ej: '/tareas', '/gastos', etc)
   */
  goTo(path: string) {
    this.router.navigate([path]);
  }

  /**
   * Abre una ventana modal con el resumen financiero y gráficos (DashboardModalComponent).
   * Útil para mostrar información financiera y KPIs de manera gráfica.
   */
  async openDashboard() {
    const modal = await this.modalController.create({
      component: DashboardModalComponent,
    });
    await modal.present();
  }

  /**
   * Cierra la sesión actual del usuario.
   * No realiza navegación directa: se espera que los guards/redirecciones manejen la transición tras logout.
   */
  async logout() {
    await this.authService.logout();
  }
}
