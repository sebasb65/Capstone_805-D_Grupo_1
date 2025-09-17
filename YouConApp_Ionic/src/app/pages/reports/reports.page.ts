import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController } from '@ionic/angular';
import { PdfReportService } from '../../services/pdf-report.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ReportsPage {
  reportForm: FormGroup;
  private fb = inject(FormBuilder);
  private pdfReportService = inject(PdfReportService);
  private loadingCtrl = inject(LoadingController);

  constructor() {
    this.reportForm = this.fb.group({
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
    });
  }

  async generateReport() {
    if (this.reportForm.invalid) return;

    const loading = await this.loadingCtrl.create({ message: 'Generando reporte...' });
    await loading.present();

    const { fecha_inicio, fecha_fin } = this.reportForm.value;
    try {
      // Llamamos al servicio para que haga todo el trabajo
      await this.pdfReportService.generatePaymentReport(fecha_inicio.split('T')[0], fecha_fin.split('T')[0]);
    } catch (error) {
      console.error('Error al generar el reporte', error);
    } finally {
      loading.dismiss();
    }
  }
}