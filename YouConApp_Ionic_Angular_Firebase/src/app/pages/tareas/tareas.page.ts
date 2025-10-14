import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Trabajador, Tarea, Cultivo } from '../../services/data.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class TareasPage implements OnInit {
  tareaForm: FormGroup;
  trabajadores$: Observable<Trabajador[]>;
  cultivos$: Observable<Cultivo[]>;
  tiposDeTarea = ['Cosecha', 'Poda', 'Siembra', 'Riego', 'Aplicación Químicos', 'Otro'];
  calidadesCosecha = ['Primera', 'Segunda', 'Revuelta'];
  esCosecha = false;
  private userId: string | null = null;

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private router = inject(Router);

  constructor() {
    this.trabajadores$ = this.dataService.getTrabajadores();
    this.cultivos$ = this.dataService.getCultivos();
    this.authService.user$.subscribe(user => this.userId = user ? user.uid : null);

    this.tareaForm = this.fb.group({
      trabajador: [null, Validators.required],
      fecha: [new Date().toISOString(), Validators.required],
      tipo_tarea: [null, Validators.required],
      cultivo: [null],
      pago_simple: [0],
      detalle_cosecha: this.fb.array([])
    });
  }

  ngOnInit() { 
    this.tareaForm.get('tipo_tarea')?.valueChanges.subscribe(value => { 
      this.esCosecha = (value === 'Cosecha'); 
      this.actualizarFormularioPorTipoTarea(value); 
    }); 
  }

  get detallesCosechaForm(): FormArray { 
    return this.tareaForm.get('detalle_cosecha') as FormArray; 
  }

  actualizarFormularioPorTipoTarea(tipo: string) { 
    this.detallesCosechaForm.clear(); 
    if (tipo === 'Cosecha') { 
      this.addDetalleCosecha(); 
    } 
  }

  addDetalleCosecha() { 
    const detalleGroup = this.fb.group({ 
      calidad: ['Primera', Validators.required], 
      cantidad: [, [Validators.required, Validators.min(0)]], 
      precio: [, [Validators.required, Validators.min(0)]] 
    }); 
    this.detallesCosechaForm.push(detalleGroup); 
  }

  removeDetalleCosecha(index: number) { 
    this.detallesCosechaForm.removeAt(index); 
  }

  async guardarTarea() {
    if (this.tareaForm.invalid || !this.userId) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    const formValue = this.tareaForm.value;
    const trabajadorSeleccionado: Trabajador = formValue.trabajador;
    const cultivoSeleccionado: Cultivo | null = formValue.cultivo;
    let pagoCalculado = this.esCosecha ? formValue.detalle_cosecha.reduce((total: number, d: any) => total + (d.cantidad * d.precio), 0) : formValue.pago_simple;

    const nuevaTarea: Omit<Tarea, 'id'> = {
      id_trabajador: trabajadorSeleccionado.id!,
      nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
      fecha: formValue.fecha.split('T')[0],
      tipo_tarea: formValue.tipo_tarea,
      pago_calculado: pagoCalculado,
      id_agricultor: this.userId,
      id_cultivo: cultivoSeleccionado ? cultivoSeleccionado.id : undefined,
      nombre_cultivo: cultivoSeleccionado ? cultivoSeleccionado.nombre : undefined,
      detalle_cosecha: this.esCosecha ? formValue.detalle_cosecha : null
    };

    try {
      await this.dataService.addTaskWithBalanceUpdate(nuevaTarea);
      await loading.dismiss();
      this.presentToast('Tarea guardada con éxito.', 'success');
      this.router.navigate(['/home']);
    } catch (error) {
      await loading.dismiss();
      this.presentToast('Error al guardar la tarea.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}