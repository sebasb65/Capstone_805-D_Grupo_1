import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
// Asegúrate de tener ngx-charts instalado
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard-modal',
  templateUrl: './dashboard-modal.component.html',
  styleUrls: ['./dashboard-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NgxChartsModule]
})
export class DashboardModalComponent implements OnInit {

  // Observables para las tarjetas
  totalIngresos$!: Observable<number>;
  totalGastos$!: Observable<number>;
  costoManoDeObra$!: Observable<number>;
  balanceGeneral$!: Observable<number>;

  // Datos para el gráfico
  chartData$!: Observable<any[]>;

  // Esquema de colores: Verde (Ingresos), Rojo (Gastos), Amarillo (Mano de Obra)
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#2dd36f', '#eb445a', '#ffc409'] 
  };

  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);

  constructor() { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // 1. Totales individuales
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

    // 2. Balance General
    this.balanceGeneral$ = combineLatest([
      this.totalIngresos$,
      this.totalGastos$,
      this.costoManoDeObra$
    ]).pipe(
      map(([ingresos, gastos, manoDeObra]) => ingresos - (gastos + manoDeObra))
    );

    // 3. Datos formateados para el Gráfico
    this.chartData$ = combineLatest([
      this.totalIngresos$,
      this.totalGastos$,
      this.costoManoDeObra$
    ]).pipe(
      map(([ingresos, gastos, manoDeObra]) => [
        { name: 'Ingresos', value: ingresos },
        { name: 'Gastos', value: gastos },
        { name: 'Mano de Obra', value: manoDeObra }
      ])
    );
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}