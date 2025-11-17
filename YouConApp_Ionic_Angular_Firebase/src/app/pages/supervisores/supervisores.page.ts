// Importaciones de Angular, Ionic y formularios
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

// Servicios propios para autenticación y acceso a datos
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

/**
 * Componente de página para gestión de supervisores (solo visible para admin).
 * Permite listar, registrar y eliminar supervisores asociados al admin actual.
 */
@Component({
  selector: 'app-supervisores',
  templateUrl: './supervisores.page.html',
  styleUrls: ['./supervisores.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class SupervisoresPage implements OnInit {

  // Observable que emite la lista de supervisores asociados al admin actual
  supervisores$!: Observable<any[]>;

  // Formulario reactivo para registrar supervisores
  form!: FormGroup;

  // Inyección de dependencias con Angular inject API
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);

  constructor() {}

  /**
   * Hook de inicialización:
   * - Inicializa el formulario de supervisor (nombre y email obligatorios)
   * - Suscribe el observable user$ y obtiene los supervisores del admin autenticado
   */
  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],           // Nombre requerido
      email: ['', [Validators.required, Validators.email]], // Email válido requerido
      telefono: ['']                                 // Teléfono opcional
    });

    // Carga los supervisores de este admin apenas se reconoce el usuario
    this.authService.user$.subscribe(user => {
      if (user) {
        this.supervisores$ = this.dataService.getSupervisoresByAdmin(user.uid);
      }
    });
  }

  /**
   * Agrega un nuevo supervisor validando primero el formulario.
   * Da mensajes de alerta apropiados en caso de error o éxito.
   */
  async agregarSupervisor() {
    // Si el formulario no es válido, muestra alerta
    if (this.form.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Formulario incompleto',
        message: 'Debes ingresar al menos nombre y un correo válido.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    // Verifica usuario autenticado antes de poder asociar al adminUid
    const user = await this.getCurrentUser();
    if (!user) {
      const alert = await this.alertCtrl.create({
        header: 'Sesión no válida',
        message: 'Debes iniciar sesión nuevamente.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    // Obtiene los valores del formulario
    const { nombre, email, telefono } = this.form.value;

    try {
      // Llama al método del servicio para guardar el supervisor en Firestore
      await this.dataService.addSupervisor({
        nombre,
        email,
        telefono: telefono || '',
        adminUid: user.uid,
      });

      // Limpia el formulario
      this.form.reset();

      // Alerta de éxito
      const alert = await this.alertCtrl.create({
        header: 'Supervisor agregado',
        message: 'El supervisor ha sido registrado correctamente. Luego podrá crear su cuenta usando ese correo.',
        buttons: ['OK'],
      });
      await alert.present();

    } catch (error) {
      // Si ocurre error durante la inserción
      console.error(error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Ocurrió un error al guardar el supervisor.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  /**
   * Muestra alerta de confirmación antes de eliminar un supervisor.
   * Si se confirma, llama al método del servicio para eliminarlo.
   * @param sup - Supervisor a eliminar
   */
  async eliminarSupervisor(sup: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar supervisor',
      message: `¿Seguro que deseas eliminar al supervisor "${sup.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.dataService.deleteSupervisor(sup.id);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Función utilitaria para obtener el usuario autenticado actual de manera "promise"
   * Usada antes de asignar el adminUid al nuevo supervisor.
   */
  private getCurrentUser(): Promise<any> {
    return new Promise(resolve => {
      const sub = this.authService.user$.subscribe(u => {
        sub.unsubscribe();
        resolve(u);
      });
    });
  }
}
