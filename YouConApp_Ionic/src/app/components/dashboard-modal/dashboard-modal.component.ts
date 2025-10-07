import { Component, OnInit, inject } from '@angular/core';  
import { CommonModule } from '@angular/common';  
import { IonicModule, ModalController } from '@ionic/angular';  
import { Observable, combineLatest } from 'rxjs';  
import { map, startWith } from 'rxjs/operators';  
import { DataService } from '../../services/data.service';  

@Component({
  selector: 'app-dashboard-modal',               // Tag HTML para instanciar este modal
  templateUrl: './dashboard-modal.component.html', 
  styleUrls: ['./dashboard-modal.component.scss'],
  standalone: true,  
  imports: [IonicModule, CommonModule]           // Módulos necesarios dentro del modal
})
export class DashboardModalComponent implements OnInit {

  // Observables que emitirán los totales calculados
  totalIngresos$!: Observable<number>;           
  totalGastos$!: Observable<number>;             
  costoManoDeObra$!: Observable<number>;         
  balanceGeneral$!: Observable<number>;          

  // Inyectamos el servicio de datos y el controlador del modal
  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);

  constructor() { }

  ngOnInit() {
    // Al inicializar, cargar los datos del dashboard
    this.loadDashboardData();
  }

  // Construye los streams con totales y balance general
  loadDashboardData() {
    // Suma todos los montos de ventas y emite un 0 antes de recibir datos
    this.totalIngresos$ = this.dataService.getVentas().pipe(
      map(ventas => ventas.reduce((total, venta) => total + venta.total_venta, 0)),
      startWith(0)
    );

    // Suma todos los gastos y emite un 0 antes de recibir datos
    this.totalGastos$ = this.dataService.getGastos().pipe(
      map(gastos => gastos.reduce((total, gasto) => total + gasto.monto, 0)),
      startWith(0)
    );

    // Suma el costo de mano de obra de todas las tareas y emite un 0 inicial
    this.costoManoDeObra$ = this.dataService.getTareas().pipe(
      map(tareas => tareas.reduce((total, tarea) => total + tarea.pago_calculado, 0)),
      startWith(0)
    );

    // Calcula el balance general: ingresos − (gastos + mano de obra)
    this.balanceGeneral$ = combineLatest([
      this.totalIngresos$,
      this.totalGastos$,
      this.costoManoDeObra$
    ]).pipe(
      map(([ingresos, gastos, manoDeObra]) => ingresos - (gastos + manoDeObra))
    );
  }

  // Cierra el modal cuando el usuario lo solicite
  dismiss() {
    this.modalCtrl.dismiss();
  }
}
