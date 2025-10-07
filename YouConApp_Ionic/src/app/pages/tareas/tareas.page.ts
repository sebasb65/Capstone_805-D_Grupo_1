import { Component, OnInit, inject } from '@angular/core';  
import { CommonModule } from '@angular/common';  
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';  
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';  
import { Observable } from 'rxjs';  
import { DataService, Trabajador, Tarea, Cultivo } from '../../services/data.service';  
import { Router } from '@angular/router';  
import { AuthService } from '../../services/auth.service';  

@Component({
  selector: 'app-tareas',                         // Nombre del elemento HTML para usar este componente
  templateUrl: './tareas.page.html',              // Archivo de plantilla asociado
  standalone: true,                               // Componente independiente sin módulo padre
  imports: [IonicModule, CommonModule, ReactiveFormsModule]  
})
export class TareasPage implements OnInit {
  tareaForm: FormGroup;                           // Formulario reactivo para capturar datos de la tarea
  trabajadores$: Observable<Trabajador[]>;        // Observable con lista de trabajadores
  cultivos$: Observable<Cultivo[]>;               // Observable con lista de cultivos

  tiposDeTarea = [                                // Opciones de tipo de tarea
    'Cosecha', 'Poda', 'Siembra', 'Riego', 'Aplicación Químicos', 'Otro'
  ];
  calidadesCosecha = [                            // Opciones de calidad para cosecha
    'Primera', 'Segunda', 'Revuelta'
  ];

  esCosecha = false;                              // Indica si el tipo de tarea es 'Cosecha'
  private userId: string | null = null;          // Almacena el ID del usuario autenticado

  // Inyección de dependencias usando API 'inject'
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private router = inject(Router);

  constructor() {
    // Obtener lista de trabajadores y cultivos desde el servicio de datos
    this.trabajadores$ = this.dataService.getTrabajadores();
    this.cultivos$ = this.dataService.getCultivos();

    // Suscribirse a la autenticación para capturar el ID del usuario
    this.authService.user$.subscribe(user => {
      this.userId = user ? user.uid : null;
    });

    // Inicializar el formulario con campos y validaciones
    this.tareaForm = this.fb.group({
      trabajador: [null, Validators.required],           // Campo obligatorio
      fecha: [new Date().toISOString(), Validators.required],  
      tipo_tarea: [null, Validators.required],           // Determina si es cosecha u otro tipo
      cultivo: [null],                                   // Solo obligatorio en cosecha
      pago_simple: [0],                                  // Pago fijo para tareas no cosecha
      detalle_cosecha: this.fb.array([])                 // Array de detalles para cosecha
    });
  }

  ngOnInit() {
    // Escuchar cambios en el selector de tipo de tarea
    this.tareaForm.get('tipo_tarea')?.valueChanges.subscribe(value => {
      this.esCosecha = (value === 'Cosecha');            // Actualizar bandera de cosecha
      this.actualizarFormularioPorTipoTarea(value);      // Modificar campos según tipo
    });
  }

  // Facilita el acceso al FormArray de detalle_cosecha
  get detallesCosechaForm(): FormArray {
    return this.tareaForm.get('detalle_cosecha') as FormArray;
  }

  // Limpia y crea al menos un grupo de detalle cuando es cosecha
  actualizarFormularioPorTipoTarea(tipo: string) {
    this.detallesCosechaForm.clear();                   // Eliminar todos los detalles previos
    if (tipo === 'Cosecha') {
      this.addDetalleCosecha();                         // Agregar un detalle inicial
    }
  }

  // Agrega un nuevo grupo con campos de calidad, cantidad y precio
  addDetalleCosecha() {
    const detalleGroup = this.fb.group({
      calidad: ['Primera', Validators.required],         // Valor por omisión 'Primera'
      cantidad: [null, [Validators.required, Validators.min(0)]],
      precio: [null, [Validators.required, Validators.min(0)]]
    });
    this.detallesCosechaForm.push(detalleGroup);         // Insertar el grupo en el array
  }

  // Elimina un detalle de cosecha por índice
  removeDetalleCosecha(index: number) {
    this.detallesCosechaForm.removeAt(index);
  }

  // Método principal para guardar la tarea en el backend
  async guardarTarea() {
    // No continuar si el formulario falla validaciones o no hay usuario
    if (this.tareaForm.invalid || !this.userId) return;

    // Mostrar loading mientras se guarda
    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    // Leer valores del formulario
    const formValue = this.tareaForm.value;
    const trabajadorSeleccionado: Trabajador = formValue.trabajador;
    const cultivoSeleccionado: Cultivo | null = formValue.cultivo;

    // Calcular el pago según si es cosecha o no
    const pagoCalculado = this.esCosecha
      ? formValue.detalle_cosecha.reduce(
          (total: number, d: any) => total + d.cantidad * d.precio,
          0
        )
      : formValue.pago_simple;

    // Construir objeto Tarea sin el campo 'id'
    const nuevaTarea: Omit<Tarea, 'id'> = {
      id_trabajador: trabajadorSeleccionado.id!,
      nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
      fecha: formValue.fecha.split('T')[0],            // Solo fecha, sin hora
      tipo_tarea: formValue.tipo_tarea,
      pago_calculado: pagoCalculado,
      id_agricultor: this.userId,
      id_cultivo: cultivoSeleccionado ? cultivoSeleccionado.id : undefined,
      nombre_cultivo: cultivoSeleccionado ? cultivoSeleccionado.nombre : undefined,
      detalle_cosecha: this.esCosecha ? formValue.detalle_cosecha : null
    };

    try {
      // Llamada al servicio que guarda la tarea y actualiza balance
      await this.dataService.addTaskWithBalanceUpdate(nuevaTarea);

      await loading.dismiss();                           // Cerrar loading
      this.presentToast('Tarea guardada con éxito.', 'success');
      this.router.navigate(['/home']);                  // Navegar a pantalla principal
    } catch {
      await loading.dismiss();
      this.presentToast('Error al guardar la tarea.', 'danger');
    }
  }

  // Función genérica para mostrar un toast
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
