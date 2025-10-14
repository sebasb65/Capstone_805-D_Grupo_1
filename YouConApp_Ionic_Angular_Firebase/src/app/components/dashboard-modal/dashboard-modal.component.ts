import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-dashboard-modal',
  templateUrl: './dashboard-modal.component.html',
  styleUrls: ['./dashboard-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DashboardModalComponent implements OnInit {

  totalIngresos$!: Observable<number>;
  totalGastos$!: Observable<number>;
  costoManoDeObra$!: Observable<number>;
  balanceGeneral$!: Observable<number>;

  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);

  constructor() { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.totalIngresos$ = this.dataService.getVentas().pipe(
      map(ventas => ventas.reduce((total, venta) => total + venta.total_venta, 0)),
      startWith(0)
    );

    this.totalGastos$ = this.dataService.getGastos().pipe(
      map(gastos => gastos.reduce((total, gasto) => total + gasto.monto, 0)),
      startWith(0)
    );

    this.costoManoDeObra$ = this.dataService.getTareas().pipe(
      map(tareas => tareas.reduce((total, tarea) => total + tarea.pago_calculado, 0)),
      startWith(0)
    );

    this.balanceGeneral$ = combineLatest([
      this.totalIngresos$,
      this.totalGastos$,
      this.costoManoDeObra$
    ]).pipe(
      map(([ingresos, gastos, manoDeObra]) => ingresos - (gastos + manoDeObra))
    );
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}