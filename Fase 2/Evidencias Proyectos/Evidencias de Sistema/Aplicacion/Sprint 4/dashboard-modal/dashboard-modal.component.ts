// Importaciones principales de Angular e Ionic
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

// Importaciones de RxJS para programación reactiva y manipulación de streams
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

// Importación del servicio de datos, que accede a Firestore/API
import { DataService } from '../../services/data.service';

/**
 * Componente modal para mostrar el resumen del dashboard (finanzas)
 * Calcula y muestra totales de ingresos, gastos, mano de obra y el balance financiero general.
 */
@Component({
  selector: 'app-dashboard-modal',
  templateUrl: './dashboard-modal.component.html',
  styleUrls: ['./dashboard-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DashboardModalComponent implements OnInit {

  // Observable que contiene el total de todos los ingresos (ventas)
  totalIngresos$!: Observable<number>;
  // Observable que contiene el total de todos los gastos generales
  totalGastos$!: Observable<number>;
  // Observable que contiene el costo total de mano de obra (pagos realizados por tareas)
  costoManoDeObra$!: Observable<number>;
  // Observable que calcula el balance general (ingresos menos gastos y mano de obra)
  balanceGeneral$!: Observable<number>;

  // Inyección de servicios usando el patrón moderno de Angular
  private dataService = inject(DataService);      // Acceso a datos
  private modalCtrl = inject(ModalController);    // Controlador para cerrar el modal

  /**
   * Constructor vacío (toda la inicialización ocurre en ngOnInit)
   */
  constructor() { }

  /**
   * Hook de inicialización del ciclo de vida Angular
   * Carga los datos del dashboard usando los servicios y pipes de RxJS
   */
  ngOnInit() {
    this.loadDashboardData();
  }

  /**
   * Inicializa los observables agregados que representan los KPIs del dashboard
   * Usa RxJS para sumar y calcular a partir de los datos obtenidos
   */
  loadDashboardData() {
    // Total de ingresos: suma todos los 'total_venta' de las ventas
    this.totalIngresos$ = this.dataService.getVentas().pipe(
      map(ventas => ventas.reduce((total, venta) => total + venta.total_venta, 0)),
      startWith(0)
    );

    // Total de gastos: suma todos los 'monto'
    this.totalGastos$ = this.dataService.getGastos().pipe(
      map(gastos => gastos.reduce((total, gasto) => total + gasto.monto, 0)),
      startWith(0)
    );

    // Costo total de mano de obra: suma todos los pagos calculados en tareas
    this.costoManoDeObra$ = this.dataService.getTareas().pipe(
      map(tareas => tareas.reduce((total, tarea) => total + tarea.pago_calculado, 0)),
      startWith(0)
    );

    // Balance general: ingresos menos la suma de gastos y mano de obra
    // Esto se actualiza siempre que cambien alguno de los 3 KPIs anteriores
    this.balanceGeneral$ = combineLatest([
      this.totalIngresos$,
      this.totalGastos$,
      this.costoManoDeObra$
    ]).pipe(
      map(([ingresos, gastos, manoDeObra]) => ingresos - (gastos + manoDeObra))
    );
  }

  /**
   * Cierra el modal de dashboard, útil para volver a la página principal
   */
  dismiss() {
    this.modalCtrl.dismiss();
  }
}
