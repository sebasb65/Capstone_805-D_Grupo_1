// Importaciones necesarias de Angular Core
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones de componentes y controladores de Ionic
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';

// Importaciones de RxJS para programación reactiva
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

// Servicio de datos y modelo Trabajador
import { DataService, Trabajador } from '../../services/data.service';

// Componente modal para crear/editar trabajadores
import { TrabajadorModalComponent } from '../../components/trabajador-modal/trabajador-modal.component';

// Tipo personalizado para definir las opciones de ordenamiento
type SortBy = 'nombre' | 'apellido' | 'saldo_acumulado';

/**
 * Componente de página para gestionar trabajadores
 * Permite listar, buscar, ordenar, crear, editar y archivar trabajadores
 * Implementa búsqueda reactiva y ordenamiento dinámico usando RxJS
 */
@Component({
  selector: 'app-trabajadores',
  templateUrl: './trabajadores.page.html',
  standalone: true, // Componente standalone
  imports: [IonicModule, CommonModule]
})
export class TrabajadoresPage implements OnInit {

  // Observable que emite la lista de trabajadores filtrados y ordenados
  public trabajadores$: Observable<Trabajador[]>;
  
  // Inyección de dependencias usando el patrón inject()
  private dataService = inject(DataService); // Servicio para operaciones CRUD
  private modalCtrl = inject(ModalController); // Controlador de modales
  private alertCtrl = inject(AlertController); // Controlador de alertas
  private toastCtrl = inject(ToastController); // Controlador de mensajes toast

  // BehaviorSubject que mantiene el término de búsqueda actual
  // Emite '' (vacío) por defecto
  private searchTerm$ = new BehaviorSubject<string>('');
  
  // BehaviorSubject que mantiene el criterio de ordenamiento actual
  // Emite 'nombre' por defecto
  private sortBy$ = new BehaviorSubject<SortBy>('nombre');

  /**
   * Constructor del componente
   * Configura el pipeline reactivo para filtrado y ordenamiento
   * Combina 3 observables: lista de trabajadores, término de búsqueda, y criterio de orden
   */
  constructor() {
    // Obtiene el observable de todos los trabajadores desde Firestore
    const todosLosTrabajadores$ = this.dataService.getTrabajadores();

    // Combina múltiples observables en uno solo
    // Emite cada vez que cualquiera de los observables cambia
    this.trabajadores$ = combineLatest([
      todosLosTrabajadores$,           // Lista completa de trabajadores
      this.searchTerm$.pipe(startWith('')),  // Término de búsqueda (inicia con '')
      this.sortBy$.pipe(startWith('nombre' as SortBy))  // Criterio de orden (inicia con 'nombre')
    ]).pipe(
      // Transforma los datos combinados aplicando filtrado y ordenamiento
      map(([trabajadores, term, sortBy]) => {
        // PASO 1: Filtrar trabajadores según el término de búsqueda
        // Busca coincidencias en nombre o apellido (case-insensitive)
        const trabajadoresFiltrados = trabajadores.filter(t => 
          t.nombre.toLowerCase().includes(term.toLowerCase()) ||
          t.apellido.toLowerCase().includes(term.toLowerCase())
        );

        // PASO 2: Ordenar los trabajadores filtrados según el criterio seleccionado
        return [...trabajadoresFiltrados].sort((a, b) => {
          if (sortBy === 'saldo_acumulado') {
            // Ordenar por saldo de mayor a menor (descendente)
            return b.saldo_acumulado - a.saldo_acumulado;
          } else {
            // Ordenar alfabéticamente por nombre o apellido (ascendente)
            // localeCompare respeta acentos y caracteres especiales del español
            return a[sortBy].localeCompare(b[sortBy]);
          }
        });
      })
    );
  }

  /**
   * Hook de inicialización del componente
   * Se ejecuta después de que Angular inicializa el componente
   * Vacío porque toda la lógica se configura en el constructor
   */
  ngOnInit() {}

  /**
   * Maneja los cambios en el campo de búsqueda
   * Emite el nuevo valor al BehaviorSubject searchTerm$
   * Esto dispara automáticamente el refiltrado de trabajadores
   * @param event - Evento del input de búsqueda
   */
  handleSearch(event: any) {
    this.searchTerm$.next(event.detail.value);
  }

  /**
   * Maneja los cambios en el selector de ordenamiento
   * Emite el nuevo criterio al BehaviorSubject sortBy$
   * Esto dispara automáticamente el reordenamiento de trabajadores
   * @param event - Evento del selector de ordenamiento
   */
  handleSort(event: any) {
    this.sortBy$.next(event.detail.value);
  }

  /**
   * Abre un modal para crear o editar un trabajador
   * Si se pasa un trabajador, se abre en modo edición
   * Si no se pasa, se abre en modo creación
   * @param trabajador - Trabajador a editar (opcional)
   */
  async openModal(trabajador?: Trabajador) {
    // Crea el modal con el componente TrabajadorModalComponent
    const modal = await this.modalCtrl.create({ 
      component: TrabajadorModalComponent, 
      componentProps: { trabajador } // Pasa el trabajador como prop (undefined si es nuevo)
    });
    // Muestra el modal
    await modal.present();
  }

  /**
   * Muestra una alerta de confirmación antes de archivar un trabajador
   * El archivado es una acción destructiva que oculta al trabajador de las listas
   * @param trabajador - Trabajador a archivar
   */
  async confirmArchive(trabajador: Trabajador) {
    // Crea la alerta de confirmación
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar a ${trabajador.nombre}? Ya no aparecerá en las listas.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar
        { 
          text: 'Archivar', 
          role: 'destructive', // Rol destructivo (color rojo)
          handler: () => this.archiveTrabajador(trabajador.id!) // Ejecuta el archivado al confirmar
        }
      ]
    });
    // Muestra la alerta
    await alert.present();
  }

  /**
   * Ejecuta el archivado de un trabajador en Firestore
   * Método privado llamado después de confirmar la acción
   * @param id - ID del trabajador a archivar
   */
  private async archiveTrabajador(id: string) {
    try {
      // Llama al servicio para archivar el trabajador
      await this.dataService.archiveTrabajador(id);
      
      // Muestra mensaje de éxito
      this.presentToast('Trabajador archivado.', 'success');
    } catch (error) {
      // Muestra mensaje de error si falla
      this.presentToast('Error al archivar.', 'danger');
    }
  }

  /**
   * Muestra un mensaje toast en la pantalla
   * @param message - Texto del mensaje a mostrar
   * @param color - Color del toast ('success' para verde, 'danger' para rojo)
   */
  async presentToast(message: string, color: 'success'|'danger' = 'success') { 
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
