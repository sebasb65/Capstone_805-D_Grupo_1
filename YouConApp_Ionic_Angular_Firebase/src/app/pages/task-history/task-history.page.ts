// Importaciones necesarias de Angular Core
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones para formularios reactivos de Angular
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

// Importaciones de componentes y controladores de Ionic
import { IonicModule, AlertController, ToastController } from '@ionic/angular';

// Importaciones de RxJS para programación reactiva
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, map, startWith } from 'rxjs/operators';

// Servicio de datos y sus interfaces (modelos)
import { DataService, Tarea, Trabajador, Cultivo, TaskFilters } from '../../services/data.service';

/**
 * Componente de página para visualizar el historial de tareas
 * Permite filtrar tareas por fecha, trabajador y cultivo
 * Calcula automáticamente el costo total de las tareas filtradas
 * Permite eliminar tareas con actualización automática del saldo del trabajador
 */
@Component({
  selector: 'app-task-history',
  templateUrl: './task-history.page.html',
  styleUrls: ['./task-history.page.scss'],
  standalone: true, // Componente standalone
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class TaskHistoryPage implements OnInit {

  // Observable que contiene la lista de trabajadores para el filtro
  public trabajadores$: Observable<Trabajador[]>;
  
  // Observable que contiene la lista de cultivos para el filtro
  public cultivos$: Observable<Cultivo[]>;
  
  // Observable que emite la lista de tareas filtradas según los criterios seleccionados
  public tareasFiltradas$: Observable<Tarea[]>;
  
  // Observable que calcula el costo total de las tareas filtradas
  public totalCostos$: Observable<number>;
  
  // BehaviorSubject que mantiene los filtros actuales
  // Emite objeto vacío {} por defecto (sin filtros = todas las tareas)
  private filters$ = new BehaviorSubject<TaskFilters>({});
  
  // Formulario reactivo para los controles de filtrado
  public filterForm: FormGroup;

  // Inyección de dependencias usando el patrón inject()
  private dataService = inject(DataService); // Servicio para operaciones CRUD
  private fb = inject(FormBuilder); // Constructor de formularios reactivos
  private alertCtrl = inject(AlertController); // Controlador de alertas
  private toastCtrl = inject(ToastController); // Controlador de mensajes toast

  /**
   * Constructor del componente
   * Inicializa el formulario de filtros y configura los observables reactivos
   */
  constructor() {
    // Inicializa el formulario de filtros con 4 campos (todos opcionales)
    this.filterForm = this.fb.group({
      fecha_inicio: [null], // Fecha de inicio del rango de filtrado
      fecha_fin: [null],    // Fecha de fin del rango de filtrado
      id_trabajador: [null], // ID del trabajador para filtrar
      id_cultivo: [null]     // ID del cultivo para filtrar
    });

    // Obtiene la lista de trabajadores desde Firestore para el selector de filtro
    this.trabajadores$ = this.dataService.getTrabajadores();
    
    // Obtiene la lista de cultivos desde Firestore para el selector de filtro
    this.cultivos$ = this.dataService.getCultivos();

    // Pipeline reactivo: escucha cambios en filters$ y obtiene tareas filtradas
    // switchMap cancela solicitudes anteriores si hay un nuevo filtro (evita race conditions)
    this.tareasFiltradas$ = this.filters$.pipe(
      switchMap(filters => this.dataService.getTareas(filters))
    );

    // Pipeline reactivo: calcula el costo total de las tareas filtradas
    // map transforma el array de tareas en un número (suma de pago_calculado)
    // reduce suma todos los valores de pago_calculado, comenzando desde 0
    this.totalCostos$ = this.tareasFiltradas$.pipe(
      map(tareas => tareas.reduce((total, tarea) => total + tarea.pago_calculado, 0))
    );
  }

  /**
   * Hook de inicialización del componente
   * Configura la suscripción a cambios en el formulario de filtros
   * Cada vez que el usuario cambia un filtro, actualiza filters$ automáticamente
   */
  ngOnInit() {
    // Suscripción a cambios en cualquier campo del formulario
    // startWith emite inmediatamente el valor actual del formulario al inicio
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value)
    ).subscribe(formValue => {
      // Construye el objeto de filtros a partir de los valores del formulario
      const filters: TaskFilters = {
        // Extrae solo la fecha (YYYY-MM-DD) del valor datetime del input
        // split('T')[0] separa por 'T' y toma la primera parte (la fecha)
        fecha_inicio: formValue.fecha_inicio?.split('T')[0],
        fecha_fin: formValue.fecha_fin?.split('T')[0],
        // IDs pueden ser null (sin filtro) o el ID seleccionado
        id_trabajador: formValue.id_trabajador,
        id_cultivo: formValue.id_cultivo,
      };
      // Emite los nuevos filtros, lo que dispara la recarga de tareas
      this.filters$.next(filters);
    });
  }

  /**
   * Limpia todos los filtros aplicados
   * Reset el formulario a sus valores iniciales (todos null)
   * Esto automáticamente dispara la recarga de todas las tareas sin filtros
   */
  limpiarFiltros() {
    this.filterForm.reset();
  }

  /**
   * Muestra una alerta de confirmación antes de eliminar una tarea
   * La eliminación es destructiva y afecta el saldo del trabajador
   * @param tarea - Tarea a eliminar
   */
  async confirmDelete(tarea: Tarea) {
    // Crea la alerta de confirmación
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Seguro que quieres eliminar esta tarea? El pago se descontará del saldo del trabajador.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar
        { 
          text: 'Eliminar', 
          role: 'destructive', // Rol destructivo (color rojo)
          handler: () => this.deleteTarea(tarea) // Ejecuta la eliminación al confirmar
        }
      ]
    });
    // Muestra la alerta
    await alert.present();
  }

  /**
   * Elimina una tarea de Firestore y actualiza el saldo del trabajador
   * Método privado llamado después de confirmar la acción
   * El servicio se encarga de restar el pago_calculado del saldo_acumulado
   * @param tarea - Tarea a eliminar
   */
  private async deleteTarea(tarea: Tarea) {
    try {
      // Llama al servicio que elimina la tarea y actualiza el balance atómicamente
      await this.dataService.deleteTareaWithBalanceUpdate(tarea);
      
      // Muestra mensaje de éxito
      this.presentToast('Tarea eliminada con éxito.', 'success');
    } catch (error) {
      // Muestra mensaje de error si falla
      this.presentToast('Error al eliminar la tarea.', 'danger');
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

