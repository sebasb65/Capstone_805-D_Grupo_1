import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Trabajador, Tarea, Cultivo } from '../../services/data.service';
import { Router } from '@angular/router';
// Ya no necesitamos importar AuthService directamente para el UID, lo maneja DataService
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
  maxDate: string = new Date().toISOString().split('T')[0];

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private router = inject(Router);

  constructor() {
    this.trabajadores$ = this.dataService.getTrabajadores();
    this.cultivos$ = this.dataService.getCultivos();
    
    // --- CAMBIO CRÍTICO: Usamos ownerUid$ para obtener el ID del JEFE ---
    this.dataService.ownerUid$.subscribe(uid => this.userId = uid);

    this.tareaForm = this.fb.group({
      trabajador: [null, Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      tipo_tarea: [null, Validators.required],
      cultivo: [null],
      pago_simple: [''], 
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
      cantidad: ['', Validators.required], 
      precio: ['', Validators.required] 
    });
    this.detallesCosechaForm.push(detalleGroup);
  }

  removeDetalleCosecha(index: number) { 
    this.detallesCosechaForm.removeAt(index);
  }

  // Formateador de miles
  formatMonto(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, '');
    if (valor.length > 0) {
      valor = new Intl.NumberFormat('es-CL').format(parseInt(valor, 10));
    }
    event.target.value = valor;
  }

  async guardarTarea() {
    if (this.tareaForm.invalid || !this.userId) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    try {
      const formValue = this.tareaForm.value;
      const trabajadorSeleccionado: Trabajador = formValue.trabajador;
      const cultivoSeleccionado: Cultivo | null = formValue.cultivo;

      let pagoCalculado = 0;
      let detalleCosechaLimpio = null;

      if (this.esCosecha) {
        detalleCosechaLimpio = formValue.detalle_cosecha.map((d: any) => {
          const cant = parseInt(d.cantidad.toString().replace(/\./g, ''), 10);
          const prec = parseInt(d.precio.toString().replace(/\./g, ''), 10);
          return { calidad: d.calidad, cantidad: cant, precio: prec };
        });
        pagoCalculado = detalleCosechaLimpio.reduce((total: number, d: any) => total + (d.cantidad * d.precio), 0);
      } else {
        const valStr = formValue.pago_simple ? formValue.pago_simple.toString() : '0';
        pagoCalculado = parseInt(valStr.replace(/\./g, ''), 10);
      }

      const nuevaTarea: Omit<Tarea, 'id'> = {
        id_trabajador: trabajadorSeleccionado.id!,
        nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
        fecha: formValue.fecha,
        tipo_tarea: formValue.tipo_tarea,
        pago_calculado: pagoCalculado,
        id_agricultor: this.userId, // Aquí ya va el ID correcto (Jefe)
        id_cultivo: cultivoSeleccionado ? cultivoSeleccionado.id : undefined,
        nombre_cultivo: cultivoSeleccionado ? cultivoSeleccionado.nombre : undefined,
        detalle_cosecha: this.esCosecha ? detalleCosechaLimpio : null
      };

      await this.dataService.addTaskWithBalanceUpdate(nuevaTarea);
      this.presentToast('Tarea guardada con éxito.', 'success');
      this.router.navigate(['/home']);

    } catch (error) {
      this.presentToast('Error al guardar la tarea.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}