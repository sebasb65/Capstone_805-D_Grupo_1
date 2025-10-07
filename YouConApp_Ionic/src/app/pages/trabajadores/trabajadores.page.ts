import { Component, OnInit, inject } from '@angular/core';  
import { CommonModule } from '@angular/common';  
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';  
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';  
import { map, startWith } from 'rxjs/operators';  
import { DataService, Trabajador } from '../../services/data.service';  
import { TrabajadorModalComponent } from '../../components/trabajador-modal/trabajador-modal.component';

type SortBy = 'nombre' | 'apellido' | 'saldo_acumulado';  // Campos permitidos para ordenar

@Component({
  selector: 'app-trabajadores',             // Tag HTML que representa esta página
  templateUrl: './trabajadores.page.html',  // Plantilla asociada
  standalone: true,  
  imports: [IonicModule, CommonModule]
})
export class TrabajadoresPage implements OnInit {

  // Observable con la lista filtrada y ordenada de trabajadores
  public trabajadores$: Observable<Trabajador[]>;

  // Inyección de servicios y controladores de Ionic
  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Sujeto reactivo para el término de búsqueda y criterio de orden
  private searchTerm$ = new BehaviorSubject<string>('');  
  private sortBy$ = new BehaviorSubject<SortBy>('nombre');

  constructor() {
    // Stream de todos los trabajadores desde el backend
    const todosLosTrabajadores$ = this.dataService.getTrabajadores();

    // Combina lista, búsqueda y orden en un solo stream
    this.trabajadores$ = combineLatest([
      todosLosTrabajadores$,
      this.searchTerm$.pipe(startWith('')),
      this.sortBy$.pipe(startWith('nombre' as SortBy))
    ]).pipe(
      map(([trabajadores, term, sortBy]) => {
        // Filtrar por nombre o apellido que incluyan el término
        const trabajadoresFiltrados = trabajadores.filter(t =>
          t.nombre.toLowerCase().includes(term.toLowerCase()) ||
          t.apellido.toLowerCase().includes(term.toLowerCase())
        );

        // Ordenar: por saldo descendente o alfabéticamente
        return [...trabajadoresFiltrados].sort((a, b) => {
          if (sortBy === 'saldo_acumulado') {
            return b.saldo_acumulado - a.saldo_acumulado;
          } else {
            return a[sortBy].localeCompare(b[sortBy]);
          }
        });
      })
    );
  }

  ngOnInit() {
    // No hay lógica adicional en inicialización
  }

  // Actualiza el término de búsqueda al tipear en el input
  handleSearch(event: any) {
    this.searchTerm$.next(event.detail.value);
  }

  // Actualiza el criterio de orden cuando el usuario selecciona una opción
  handleSort(event: any) {
    this.sortBy$.next(event.detail.value);
  }

  // Abre un modal para crear o editar un trabajador
  async openModal(trabajador?: Trabajador) {
    const modal = await this.modalCtrl.create({
      component: TrabajadorModalComponent,
      componentProps: { trabajador }
    });
    await modal.present();
  }

  // Muestra alerta para confirmar archivado de un trabajador
  async confirmArchive(trabajador: Trabajador) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar a ${trabajador.nombre}? Ya no aparecerá en las listas.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Archivar',
          role: 'destructive',
          handler: () => this.archiveTrabajador(trabajador.id!)
        }
      ]
    });
    await alert.present();
  }

  // Llama al servicio para archivar y muestra un toast de resultado
  private async archiveTrabajador(id: string) {
    try {
      await this.dataService.archiveTrabajador(id);
      this.presentToast('Trabajador archivado.', 'success');
    } catch {
      this.presentToast('Error al archivar.', 'danger');
    }
  }

  // Método genérico para mostrar un toast con mensaje y color
  async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
