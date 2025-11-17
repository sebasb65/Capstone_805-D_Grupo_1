// Importaciones Angular/Fundaciones del módulo, formularios reactivos, Ionic y reactividad
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

// Servicios para obtención de datos y generación de PDFs
import { DataService } from '../../services/data.service';
import { PdfReportService } from '../../services/pdf-report.service';

/**
 * Página de reportes con filtro por fecha y generación de reportes PDF.
 * Permite alternar entre reportes de pagos, gastos e ingresos.
 */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule],
})
export class ReportsPage implements OnInit {

  // Formulario reactivo del filtro de rango de fechas
  filterForm!: FormGroup;

  // Estado actual del tipo de reporte seleccionado
  reportType: 'pagos' | 'gastos' | 'ingresos' = 'pagos';

  // Observables para los datos tabulares y los totales
  pagos$!: Observable<any[]>;
  totalPagado$!: Observable<number>;

  gastos$!: Observable<any[]>;
  totalGastos$!: Observable<number>;

  ingresos$!: Observable<any[]>;
  totalIngresos$!: Observable<number>;

  // Inyección de dependencias (servicios Angular/Ionic), usando inject() (Angular 14+)
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private pdfReportService = inject(PdfReportService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {}

  /**
   * Inicializa el formulario, los observables vacíos y la suscripción a cambios de filtro.
   */
  ngOnInit() {
    // Formulario con dos inputs requeridos (inicio/fin)
    this.filterForm = this.fb.group({
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null, Validators.required],
    });

    // Inicializa los reportes vacíos
    this.resetReports();

    // Cada vez que cambian fechas, actualiza los reportes. Si alguna fecha está vacía, reinicia.
    this.filterForm.valueChanges.subscribe(({ fecha_inicio, fecha_fin }) => {
      if (fecha_inicio && fecha_fin) {
        this.loadReports(fecha_inicio, fecha_fin);
      } else {
        this.resetReports();
      }
    });
  }

  /**
   * Prepara los streams de reportes y cálculos de totales según fecha de inicio y fin.
   */
  private loadReports(fecha_inicio: string, fecha_fin: string) {
    // Pagos y total de pagos
    this.pagos$ = this.dataService.getPagos({
      fecha_inicio,
      fecha_fin,
    });
    this.totalPagado$ = this.pagos$.pipe(
      map((pagos) => pagos.reduce((sum, p) => sum + (p.monto || 0), 0))
    );

    // Gastos y total de gastos (filtra manualmente por rango usando isInRange)
    this.gastos$ = this.dataService.getGastos().pipe(
      map((gastos: any[]) => gastos.filter(g => this.isInRange(g.fecha, fecha_inicio, fecha_fin)))
    );
    this.totalGastos$ = this.gastos$.pipe(
      map((gastos) => gastos.reduce((sum, g) => sum + (g.monto || 0), 0))
    );

    // Ingresos/ventas y total de ingresos (también filtra por rango manualmente)
    this.ingresos$ = this.dataService.getVentas().pipe(
      map((ventas: any[]) => ventas.filter(v => this.isInRange(v.fecha, fecha_inicio, fecha_fin)))
    );
    this.totalIngresos$ = this.ingresos$.pipe(
      map((ingresos) => ingresos.reduce((sum, v) => sum + (v.total_venta || v.monto || 0), 0))
    );
  }

  /**
   * Reinicia los observables de datos y totales a arreglos/vacío en la UI.
   */
  private resetReports() {
    this.pagos$ = of([]);
    this.totalPagado$ = of(0);

    this.gastos$ = of([]);
    this.totalGastos$ = of(0);

    this.ingresos$ = of([]);
    this.totalIngresos$ = of(0);
  }

  /**
   * Dispara la generación del PDF según el tipo de reporte actual y validación de fechas.
   */
  async generatePdf() {
    // Validación básica del formulario antes de generar el PDF
    if (this.filterForm.invalid) {
      this.presentToast('Selecciona el rango de fechas antes de generar el PDF.', 'danger');
      return;
    }

    const { fecha_inicio, fecha_fin } = this.filterForm.value;

    // Muestra indicador de carga mientras se genera el reporte
    const loading = await this.loadingController.create({
      message: 'Generando reporte...',
    });
    await loading.present();

    try {
      // Llama al método de PDF según el tipo de reporte
      if (this.reportType === 'pagos') {
        await this.pdfReportService.generatePaymentReport(fecha_inicio, fecha_fin);
      } else if (this.reportType === 'gastos') {
        await this.pdfReportService.generateExpenseReport(fecha_inicio, fecha_fin);
      } else if (this.reportType === 'ingresos') {
        await this.pdfReportService.generateIncomeReport(fecha_inicio, fecha_fin);
      }
    } catch (error) {
      // Mensaje de error si ocurre alguna excepción durante la generación
      console.error(error);
      this.presentToast('Ocurrió un error al generar el PDF.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * Determina si una fecha está entre dos fechas (inclusive), ajustando los límites.
   */
  private isInRange(fecha: string, inicio: string, fin: string): boolean {
    if (!fecha) return false;
    const f = new Date(fecha);
    const fi = new Date(inicio);
    const ff = new Date(fin);
    fi.setHours(0, 0, 0, 0);
    ff.setHours(23, 59, 59, 999);
    return f >= fi && f <= ff;
  }

  /**
   * Muestra un mensaje toast en la parte inferior, usado para feedback de usuario.
   * @param message - Texto a mostrar.
   * @param color - Color ('success' o 'danger').
   */
  async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
