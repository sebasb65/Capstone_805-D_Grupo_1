// Importaciones base de Angular Core y módulos de UI y formularios
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// RxJS para observabilidad y manipulación de streams
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

// Servicios personalizados para acceso a datos y generación de PDFs
import { DataService } from '../../services/data.service';
import { PdfReportService } from '../../services/pdf-report.service';

/**
 * Componente para reporte de pagos, gastos e ingresos
 * Permite filtrar reportes por rango de fechas y generar PDFs
 */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule],
})
export class ReportsPage implements OnInit {

  // Formulario reactivo para el filtro de fechas
  filterForm!: FormGroup;

  // Tipo de reporte actual (pagos, gastos o ingresos)
  reportType: 'pagos' | 'gastos' | 'ingresos' = 'pagos';

  // Observables para cada reporte y su total
  pagos$!: Observable<any[]>;
  totalPagado$!: Observable<number>;

  gastos$!: Observable<any[]>;
  totalGastos$!: Observable<number>;

  ingresos$!: Observable<any[]>;
  totalIngresos$!: Observable<number>;

  // Inyecta los servicios y controladores necesarios
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private pdfReportService = inject(PdfReportService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {}

  /**
   * Inicializa el formulario y suscriptores en el ciclo de vida del componente
   */
  ngOnInit() {
    // Formulario reactivo para rango de fechas, ambos obligatorios
    this.filterForm = this.fb.group({
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null, Validators.required],
    });

    // Inicializa los observables en vacío
    this.resetReports();

    // Actualiza los reportes cada vez que cambian el rango de fechas
    this.filterForm.valueChanges.subscribe(({ fecha_inicio, fecha_fin }) => {
      if (fecha_inicio && fecha_fin) {
        this.loadReports(fecha_inicio, fecha_fin);
      } else {
        this.resetReports();
      }
    });
  }

  /**
   * Carga los reportes filtrando por fecha de inicio/fin
   * Prepara los streams y calcula los totales de cada tipo
   */
  private loadReports(fecha_inicio: string, fecha_fin: string) {
    // Carga pagos y total pagado
    this.pagos$ = this.dataService.getPagos({
      fecha_inicio,
      fecha_fin,
    });
    this.totalPagado$ = this.pagos$.pipe(
      map((pagos) => pagos.reduce((sum, p) => sum + (p.monto || 0), 0))
    );

    // Carga gastos filtrando por rango con función personalizada
    this.gastos$ = this.dataService.getGastos().pipe(
      map((gastos: any[]) => gastos.filter(g => this.isInRange(g.fecha, fecha_inicio, fecha_fin)))
    );
    this.totalGastos$ = this.gastos$.pipe(
      map((gastos) => gastos.reduce((sum, g) => sum + (g.monto || 0), 0))
    );

    // Carga ingresos/ventas en rango y calcula total de ingresos
    this.ingresos$ = this.dataService.getVentas().pipe(
      map((ventas: any[]) => ventas.filter(v => this.isInRange(v.fecha, fecha_inicio, fecha_fin)))
    );
    this.totalIngresos$ = this.ingresos$.pipe(
      map((ingresos) => ingresos.reduce((sum, v) => sum + (v.total_venta || v.monto || 0), 0))
    );
  }

  /**
   * Resetea los reportes y totales a valores vacíos/iniciales
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
   * Dispara la generación del PDF luego de validar el formulario
   * Llama al servicio adecuado según el tipo de reporte actual
   */
  async generatePdf() {
    // Validación previa de fechas
    if (this.filterForm.invalid) {
      this.presentToast('Selecciona el rango de fechas antes de generar el PDF.', 'danger');
      return;
    }

    // Obtiene las fechas del formulario
    const { fecha_inicio, fecha_fin } = this.filterForm.value;

    // Muestra loading durante el proceso
    const loading = await this.loadingController.create({
      message: 'Generando reporte...',
    });
    await loading.present();

    try {
      // Llama al servicio de PDF correspondiente según el tipo de reporte seleccionado
      if (this.reportType === 'pagos') {
        await this.pdfReportService.generatePaymentReport(fecha_inicio, fecha_fin);
      } else if (this.reportType === 'gastos') {
        await this.pdfReportService.generateExpenseReport(fecha_inicio, fecha_fin);
      } else if (this.reportType === 'ingresos') {
        await this.pdfReportService.generateIncomeReport(fecha_inicio, fecha_fin);
      }
    } catch (error) {
      // Manejo de errores y notificación al usuario
      console.error(error);
      this.presentToast('Ocurrió un error al generar el PDF.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * Función utilitaria para filtrar por rango de fechas
   * @param fecha - Fecha del elemento
   * @param inicio - Fecha inicio del rango
   * @param fin - Fecha fin del rango
   * @returns true si está en el rango, false si no
   */
  private isInRange(fecha: string, inicio: string, fin: string): boolean {
    if (!fecha) return false;

    const f = new Date(fecha);
    const fi = new Date(inicio);
    const ff = new Date(fin);

    // Ajusta los límites de rango para asegurar inclusión de todo el día
    fi.setHours(0, 0, 0, 0);
    ff.setHours(23, 59, 59, 999);

    return f >= fi && f <= ff;
  }

  /**
   * Muestra un mensaje toast de feedback en pantalla
   * @param message - Texto del mensaje
   * @param color - Color tipo ('success' o 'danger')
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
