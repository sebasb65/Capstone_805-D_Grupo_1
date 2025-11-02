// Importaciones necesarias de Angular Core
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones para formularios reactivos de Angular
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

// Importaciones de componentes y controladores de Ionic
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';

// Observable de RxJS para manejo de datos asíncronos
import { Observable } from 'rxjs';

// Servicio de datos y sus interfaces (modelos)
import { DataService, Trabajador, Tarea, Cultivo } from '../../services/data.service';

// Router para navegación entre páginas
import { Router } from '@angular/router';

// Servicio de autenticación para obtener el usuario actual
import { AuthService } from '../../services/auth.service';

/**
 * Componente de página para gestionar tareas agrícolas
 * Permite registrar diferentes tipos de tareas asignadas a trabajadores
 * con cálculo automático de pagos según el tipo de tarea
 */
@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.page.html',
  standalone: true, // Componente standalone
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class TareasPage implements OnInit {
  // Formulario reactivo principal para gestionar los datos de la tarea
  tareaForm: FormGroup;
  
  // Observable que contiene la lista de trabajadores disponibles
  trabajadores$: Observable<Trabajador[]>;
  
  // Observable que contiene la lista de cultivos disponibles
  cultivos$: Observable<Cultivo[]>;
  
  // Array de tipos de tarea predefinidos para selección
  tiposDeTarea = ['Cosecha', 'Poda', 'Siembra', 'Riego', 'Aplicación Químicos', 'Otro'];
  
  // Array de calidades de cosecha disponibles
  calidadesCosecha = ['Primera', 'Segunda', 'Revuelta'];
  
  // Flag para controlar si la tarea seleccionada es de tipo "Cosecha"
  esCosecha = false;
  
  // ID del usuario autenticado (agricultor)
  private userId: string | null = null;

  // Inyección de dependencias usando el patrón inject() de Angular 14+
  private fb = inject(FormBuilder); // Constructor de formularios reactivos
  private dataService = inject(DataService); // Servicio para operaciones CRUD
  private authService = inject(AuthService); // Servicio de autenticación
  private toastCtrl = inject(ToastController); // Controlador de mensajes toast
  private loadingCtrl = inject(LoadingController); // Controlador de indicadores de carga
  private router = inject(Router); // Servicio de navegación

  /**
   * Constructor del componente
   * Inicializa los observables de datos y el formulario reactivo
   * Suscribe al usuario autenticado para obtener su ID
   */
  constructor() {
    // Obtiene la lista de trabajadores desde Firestore
    this.trabajadores$ = this.dataService.getTrabajadores();
    
    // Obtiene la lista de cultivos desde Firestore
    this.cultivos$ = this.dataService.getCultivos();
    
    // Suscripción al estado de autenticación para obtener el userId
    this.authService.user$.subscribe(user => this.userId = user ? user.uid : null);

    // Inicialización del formulario reactivo con sus campos y validaciones
    this.tareaForm = this.fb.group({
      trabajador: [null, Validators.required], // Trabajador asignado (obligatorio)
      fecha: [new Date().toISOString(), Validators.required], // Fecha actual por defecto (obligatorio)
      tipo_tarea: [null, Validators.required], // Tipo de tarea (obligatorio)
      cultivo: [null], // Cultivo asociado (opcional)
      pago_simple: [0], // Pago para tareas no-cosecha
      detalle_cosecha: this.fb.array([]) // Array dinámico para detalles de cosecha
    });
  }

  /**
   * Hook de inicialización del componente
   * Se ejecuta después de que Angular inicializa el componente
   * Configura el listener para cambios en el tipo de tarea
   */
  ngOnInit() { 
    // Suscripción a cambios en el campo 'tipo_tarea'
    this.tareaForm.get('tipo_tarea')?.valueChanges.subscribe(value => { 
      // Actualiza el flag si la tarea es de tipo "Cosecha"
      this.esCosecha = (value === 'Cosecha'); 
      
      // Ajusta el formulario según el tipo de tarea seleccionado
      this.actualizarFormularioPorTipoTarea(value); 
    }); 
  }

  /**
   * Getter para acceder al FormArray de detalles de cosecha
   * Facilita el acceso desde el template y otros métodos
   * @returns FormArray con los detalles de cosecha
   */
  get detallesCosechaForm(): FormArray { 
    return this.tareaForm.get('detalle_cosecha') as FormArray; 
  }

  /**
   * Actualiza la estructura del formulario según el tipo de tarea
   * Si es "Cosecha", añade campos para detalles de cosecha
   * Si es otro tipo, limpia los detalles de cosecha
   * @param tipo - Tipo de tarea seleccionado
   */
  actualizarFormularioPorTipoTarea(tipo: string) { 
    // Limpia todos los detalles de cosecha existentes
    this.detallesCosechaForm.clear(); 
    
    // Si la tarea es "Cosecha", añade un detalle inicial
    if (tipo === 'Cosecha') { 
      this.addDetalleCosecha(); 
    } 
  }

  /**
   * Añade un nuevo grupo de controles para detalle de cosecha
   * Permite registrar múltiples calidades/cantidades en una misma tarea
   */
  addDetalleCosecha() { 
    // Crea un nuevo FormGroup con los campos de detalle de cosecha
    const detalleGroup = this.fb.group({ 
      calidad: ['Primera', Validators.required], // Calidad de la cosecha (Primera por defecto)
      cantidad: [, [Validators.required, Validators.min(0)]], // Cantidad cosechada (obligatorio, >= 0)
      precio: [, [Validators.required, Validators.min(0)]] // Precio por unidad (obligatorio, >= 0)
    }); 
    
    // Añade el grupo al FormArray
    this.detallesCosechaForm.push(detalleGroup); 
  }

  /**
   * Elimina un detalle de cosecha específico del FormArray
   * @param index - Índice del detalle a eliminar
   */
  removeDetalleCosecha(index: number) { 
    this.detallesCosechaForm.removeAt(index); 
  }

  /**
   * Guarda la tarea en Firestore y actualiza el balance del trabajador
   * Calcula automáticamente el pago según el tipo de tarea
   * Para cosecha: suma de (cantidad × precio) de todos los detalles
   * Para otros tipos: usa el pago_simple ingresado
   */
  async guardarTarea() {
    // Valida que el formulario sea válido y que exista un usuario autenticado
    if (this.tareaForm.invalid || !this.userId) return;

    // Muestra indicador de carga mientras se guarda
    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    // Obtiene los valores del formulario
    const formValue = this.tareaForm.value;
    
    // Extrae el trabajador seleccionado (objeto completo)
    const trabajadorSeleccionado: Trabajador = formValue.trabajador;
    
    // Extrae el cultivo seleccionado (puede ser null)
    const cultivoSeleccionado: Cultivo | null = formValue.cultivo;
    
    // Calcula el pago según el tipo de tarea
    // Si es cosecha: suma (cantidad × precio) de cada detalle
    // Si no es cosecha: usa el pago_simple
    let pagoCalculado = this.esCosecha 
      ? formValue.detalle_cosecha.reduce((total: number, d: any) => total + (d.cantidad * d.precio), 0) 
      : formValue.pago_simple;

    // Construye el objeto Tarea con todos los datos necesarios
    // Omit<Tarea, 'id'> indica que no incluye el campo 'id' (lo genera Firestore)
    const nuevaTarea: Omit<Tarea, 'id'> = {
      id_trabajador: trabajadorSeleccionado.id!, // ID del trabajador
      nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`, // Nombre completo
      fecha: formValue.fecha.split('T')[0], // Extrae solo la fecha (YYYY-MM-DD)
      tipo_tarea: formValue.tipo_tarea, // Tipo de tarea
      pago_calculado: pagoCalculado, // Pago total calculado
      id_agricultor: this.userId, // ID del agricultor (usuario actual)
      id_cultivo: cultivoSeleccionado ? cultivoSeleccionado.id : undefined, // ID del cultivo (opcional)
      nombre_cultivo: cultivoSeleccionado ? cultivoSeleccionado.nombre : undefined, // Nombre del cultivo (opcional)
      detalle_cosecha: this.esCosecha ? formValue.detalle_cosecha : null // Detalles solo si es cosecha
    };

    try {
      // Guarda la tarea y actualiza el balance del trabajador automáticamente
      await this.dataService.addTaskWithBalanceUpdate(nuevaTarea);
      
      // Cierra el indicador de carga
      await loading.dismiss();
      
      // Muestra mensaje de éxito
      this.presentToast('Tarea guardada con éxito.', 'success');
      
      // Navega de vuelta a la página principal
      this.router.navigate(['/home']);
    } catch (error) {
      // En caso de error, cierra el loading
      await loading.dismiss();
      
      // Muestra mensaje de error
      this.presentToast('Error al guardar la tarea.', 'danger');
    }
  }

  /**
   * Muestra un mensaje toast en la pantalla
   * @param message - Texto del mensaje a mostrar
   * @param color - Color del toast ('success' para verde, 'danger' para rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    // Crea el toast con duración de 2 segundos en la parte superior
    const toast = await this.toastCtrl.create({ 
      message, 
      duration: 2000, 
      color, 
      position: 'top' 
    });
    // Muestra el toast
    await toast.present();
  }
}
