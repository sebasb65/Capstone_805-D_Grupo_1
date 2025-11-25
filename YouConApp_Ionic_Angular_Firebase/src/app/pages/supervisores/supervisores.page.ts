import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
// Servicios propios
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-supervisores',
  templateUrl: './supervisores.page.html',
  styleUrls: ['./supervisores.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class SupervisoresPage implements OnInit {

  supervisores$!: Observable<any[]>;
  form!: FormGroup;

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);

  constructor() {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      
      // FIX: Validación estricta de email (debe tener @ y punto)
      email: ['', [
        Validators.required, 
        Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
      ]],
      
      // FIX: Validación estricta de teléfono (Solo números y +)
      telefono: ['', [Validators.pattern('^[0-9+]+$')]] 
    });

    this.authService.user$.subscribe(user => {
      if (user) {
        this.supervisores$ = this.dataService.getSupervisoresByAdmin(user.uid);
      }
    });
  }

  async agregarSupervisor() {
    // 1. Si el formulario es inválido (por regex de email o teléfono), mostramos alerta y paramos.
    if (this.form.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Datos Incorrectos',
        message: 'Por favor revisa:\n- El correo debe ser válido (ej: nombre@correo.com).\n- El teléfono solo puede contener números.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

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

    const { nombre, email, telefono } = this.form.value;

    try {
      await this.dataService.addSupervisor({
        nombre,
        email: email.toLowerCase().trim(), // Guardamos limpio
        telefono: telefono || '',
        adminUid: user.uid,
      });

      this.form.reset();

      const alert = await this.alertCtrl.create({
        header: 'Supervisor agregado',
        message: 'El supervisor ha sido registrado correctamente.',
        buttons: ['OK'],
      });
      await alert.present();

    } catch (error) {
      console.error(error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Ocurrió un error al guardar el supervisor.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

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

  private getCurrentUser(): Promise<any> {
    return new Promise(resolve => {
      const sub = this.authService.user$.subscribe(u => {
        sub.unsubscribe();
        resolve(u);
      });
    });
  }
}