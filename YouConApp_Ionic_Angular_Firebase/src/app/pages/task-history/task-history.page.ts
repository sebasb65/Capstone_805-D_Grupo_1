import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, map, startWith } from 'rxjs/operators';
import { DataService, Tarea, Trabajador, Cultivo, TaskFilters } from '../../services/data.service';

@Component({
  selector: 'app-task-history',
  templateUrl: './task-history.page.html',
  styleUrls: ['./task-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class TaskHistoryPage implements OnInit {

  public trabajadores$: Observable<Trabajador[]>;
  public cultivos$: Observable<Cultivo[]>;
  public tareasFiltradas$: Observable<Tarea[]>;
  public totalCostos$: Observable<number>;
  private filters$ = new BehaviorSubject<TaskFilters>({});
  public filterForm: FormGroup;

  private dataService = inject(DataService);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    this.filterForm = this.fb.group({
      fecha_inicio: [null],
      fecha_fin: [null],
      id_trabajador: [null],
      id_cultivo: [null]
    });

    this.trabajadores$ = this.dataService.getTrabajadores();
    this.cultivos$ = this.dataService.getCultivos();

    this.tareasFiltradas$ = this.filters$.pipe(
      switchMap(filters => this.dataService.getTareas(filters))
    );

    this.totalCostos$ = this.tareasFiltradas$.pipe(
      map(tareas => tareas.reduce((total, tarea) => total + tarea.pago_calculado, 0))
    );
  }

  ngOnInit() {
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value)
    ).subscribe(formValue => {
      const filters: TaskFilters = {
        fecha_inicio: formValue.fecha_inicio?.split('T')[0],
        fecha_fin: formValue.fecha_fin?.split('T')[0],
        id_trabajador: formValue.id_trabajador,
        id_cultivo: formValue.id_cultivo,
      };
      this.filters$.next(filters);
    });
  }

  limpiarFiltros() {
    this.filterForm.reset();
  }

  async confirmDelete(tarea: Tarea) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Seguro que quieres eliminar esta tarea? El pago se descontará del saldo del trabajador.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteTarea(tarea) }
      ]
    });
    await alert.present();
  }

  private async deleteTarea(tarea: Tarea) {
    try {
      await this.dataService.deleteTareaWithBalanceUpdate(tarea);
      this.presentToast('Tarea eliminada con éxito.', 'success');
    } catch (error) {
      this.presentToast('Error al eliminar la tarea.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}
