import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DataService, Trabajador } from '../../services/data.service';
import { TrabajadorModalComponent } from '../../components/trabajador-modal/trabajador-modal.component';

type SortBy = 'nombre' | 'apellido' | 'saldo_acumulado';

@Component({
  selector: 'app-trabajadores',
  templateUrl: './trabajadores.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TrabajadoresPage implements OnInit {

  public trabajadores$: Observable<Trabajador[]>;
  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  private searchTerm$ = new BehaviorSubject<string>('');
  private sortBy$ = new BehaviorSubject<SortBy>('nombre');

  constructor() {
    const todosLosTrabajadores$ = this.dataService.getTrabajadores();

    this.trabajadores$ = combineLatest([
      todosLosTrabajadores$,
      this.searchTerm$.pipe(startWith('')),
      this.sortBy$.pipe(startWith('nombre' as SortBy))
    ]).pipe(
      map(([trabajadores, term, sortBy]) => {
        // 1. Filtrar primero
        const trabajadoresFiltrados = trabajadores.filter(t => 
          t.nombre.toLowerCase().includes(term.toLowerCase()) ||
          t.apellido.toLowerCase().includes(term.toLowerCase())
        );

        // 2. Luego, ordenar los resultados filtrados
        return [...trabajadoresFiltrados].sort((a, b) => {
          if (sortBy === 'saldo_acumulado') {
            return b.saldo_acumulado - a.saldo_acumulado; // De mayor a menor saldo
          } else {
            // Ordenar alfabéticamente por nombre o apellido
            return a[sortBy].localeCompare(b[sortBy]);
          }
        });
      })
    );
  }

  ngOnInit() {}

  handleSearch(event: any) {
    this.searchTerm$.next(event.detail.value);
  }

  handleSort(event: any) {
    this.sortBy$.next(event.detail.value);
  }

  async openModal(trabajador?: Trabajador) {
    const modal = await this.modalCtrl.create({ 
      component: TrabajadorModalComponent, 
      componentProps: { trabajador } 
    });
    await modal.present();
  }

  async confirmArchive(trabajador: Trabajador) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar a ${trabajador.nombre}? Ya no aparecerá en las listas.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Archivar', role: 'destructive', handler: () => this.archiveTrabajador(trabajador.id!) }
      ]
    });
    await alert.present();
  }

  private async archiveTrabajador(id: string) {
    try {
      await this.dataService.archiveTrabajador(id);
      this.presentToast('Trabajador archivado.', 'success');
    } catch (error) {
      this.presentToast('Error al archivar.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success'|'danger' = 'success') { 
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}