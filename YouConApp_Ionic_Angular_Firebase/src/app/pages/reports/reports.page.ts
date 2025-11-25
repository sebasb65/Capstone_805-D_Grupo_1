import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { PdfReportService } from '../../services/pdf-report.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule],
})
export class ReportsPage implements OnInit {

  filterForm!: FormGroup;
  reportType: 'pagos' | 'gastos' | 'ingresos' = 'pagos';
  
  pagos$!: Observable<any[]>;
  totalPagado$!: Observable<number>;
  gastos$!: Observable<any[]>;
  totalGastos$!: Observable<number>;
  ingresos$!: Observable<any[]>;
  totalIngresos$!: Observable<number>;

  // Variable para bloquear fechas futuras en HTML (opcional)
  maxDate: string = new Date().toISOString().split('T')[0];

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private pdfReportService = inject(PdfReportService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {}

  ngOnInit() {
    this.filterForm = this.fb.group({
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null, Validators.required],
    });

    this.resetReports();

    this.filterForm.valueChanges.subscribe(({ fecha_inicio, fecha_fin }) => {
      if (fecha_inicio && fecha_fin) {
        this.loadReports(fecha_inicio, fecha_fin);
      } else {
        this.resetReports();
      }
    });
  }

  private loadReports(fecha_inicio: string, fecha_fin: string) {
    this.pagos$ = this.dataService.getPagos({
      fecha_inicio,
      fecha_fin,
    });
    this.totalPagado$ = this.pagos$.pipe(
      map((pagos) => pagos.reduce((sum, p) => sum + (p.monto || 0), 0))
    );

    this.gastos$ = this.dataService.getGastos().pipe(
      map((gastos: any[]) => gastos.filter(g => this.isInRange(g.fecha, fecha_inicio, fecha_fin)))
    );
    this.totalGastos$ = this.gastos$.pipe(
      map((gastos) => gastos.reduce((sum, g) => sum + (g.monto || 0), 0))
    );

    this.ingresos$ = this.dataService.getVentas().pipe(
      map((ventas: any[]) => ventas.filter(v => this.isInRange(v.fecha, fecha_inicio, fecha_fin)))
    );
    this.totalIngresos$ = this.ingresos$.pipe(
      map((ingresos) => ingresos.reduce((sum, v) => sum + (v.total_venta || v.monto || 0), 0))
    );
  }

  private resetReports() {
    this.pagos$ = of([]);
    this.totalPagado$ = of(0);
    this.gastos$ = of([]);
    this.totalGastos$ = of(0);
    this.ingresos$ = of([]);
    this.totalIngresos$ = of(0);
  }

  async generatePdf() {
    // 1. Validar que el formulario tenga datos
    if (this.filterForm.invalid) {
      this.presentToast('Por favor selecciona ambas fechas (inicio y fin).', 'danger');
      return;
    }

    const { fecha_inicio, fecha_fin } = this.filterForm.value;
    
    // --- VALIDACIONES DE SEGURIDAD ---
    const yearInicio = new Date(fecha_inicio).getFullYear();
    const yearFin = new Date(fecha_fin).getFullYear();
    
    // 2. Validar años lógicos (Evita el año 1111 o el año 3000)
    if (yearInicio < 2000 || yearFin > 2100) {
       this.presentToast('Fechas inválidas. Por favor selecciona un año real.', 'danger');
       return;
    }

    // 3. Validar coherencia temporal (Inicio no puede ser después del Fin)
    if (fecha_inicio > fecha_fin) {
       this.presentToast('Error: La fecha de inicio es mayor que la fecha de fin.', 'danger');
       return;
    }
    // ---------------------------------

    const loading = await this.loadingController.create({
      message: 'Generando reporte PDF...',
    });
    await loading.present();

    try {
      if (this.reportType === 'pagos') {
        await this.pdfReportService.generatePaymentReport(fecha_inicio, fecha_fin);
      } else if (this.reportType === 'gastos') {
        await this.pdfReportService.generateExpenseReport(fecha_inicio, fecha_fin);
      } else if (this.reportType === 'ingresos') {
        await this.pdfReportService.generateIncomeReport(fecha_inicio, fecha_fin);
      }
      
      this.presentToast('Reporte descargado con éxito.', 'success');

    } catch (error) {
      console.error(error);
      this.presentToast('Ocurrió un error al generar el PDF.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private isInRange(fecha: string, inicio: string, fin: string): boolean {
    if (!fecha) return false;
    const f = new Date(fecha);
    const fi = new Date(inicio);
    const ff = new Date(fin);
    fi.setHours(0, 0, 0, 0);
    ff.setHours(23, 59, 59, 999);
    return f >= fi && f <= ff;
  }

  async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}