import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { DataService } from './data.service';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

// IMPORTACIONES NUEVAS PARA MOVIL
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular'; // Para saber si es celular o web

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {
  
  private dataService = inject(DataService);
  private platform = inject(Platform); // Inyectamos Platform

  constructor() {}

  async generatePaymentReport(fecha_inicio: string, fecha_fin: string) {
    const pagos: any[] = await firstValueFrom(
      this.dataService.getPagos({ fecha_inicio, fecha_fin })
    );
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Pagos a Trabajadores', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`,
      14,
      30
    );

    const tableData: RowInput[] = [];
    let total = 0;
    pagos.forEach((p) => {
      const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-CL') : '';
      const nombre = p.nombre_trabajador || p.nombre || 'Trabajador';
      const monto = p.monto || 0;
      total += monto;
      tableData.push([
        fecha,
        nombre,
        { content: `$${monto.toLocaleString('es-CL')}`, styles: { halign: 'right' } } as any
      ]);
    });

    tableData.push([
      { content: 'Total Pagado', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } } as any,
      { content: `$${total.toLocaleString('es-CL')}`, styles: { halign: 'right', fontStyle: 'bold' } } as any
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Trabajador', 'Monto']],
      body: tableData,
      startY: 40
    });

    const inicio = new Date(fecha_inicio).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fin = new Date(fecha_fin).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fileName = `Pagos_${inicio}_al_${fin}.pdf`;

    // LÓGICA FINAL MEJORADA
    await this.saveAndSharePdf(doc, fileName);
  }

  async generateExpenseReport(fecha_inicio: string, fecha_fin: string) {
    const gastos: any[] = await firstValueFrom(
      this.dataService.getGastos().pipe(
        map((arr: any[]) => arr.filter(g => this.isInRange(g.fecha, fecha_inicio, fecha_fin)))
      )
    );
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Gastos', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`,
      14,
      30
    );

    const tableData: RowInput[] = [];
    let total = 0;
    gastos.forEach((g) => {
      const fecha = g.fecha ? new Date(g.fecha).toLocaleDateString('es-CL') : '';
      const desc = g.descripcion || 'Gasto';
      const categoria = g.categoria || '-';
      const monto = g.monto || 0;
      total += monto;
      tableData.push([
        fecha,
        `${desc} (${categoria})`,
        { content: `$${monto.toLocaleString('es-CL')}`, styles: { halign: 'right' } } as any
      ]);
    });

    tableData.push([
      { content: 'Total Gastado', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } } as any,
      { content: `$${total.toLocaleString('es-CL')}`, styles: { halign: 'right', fontStyle: 'bold' } } as any
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Detalle', 'Monto']],
      body: tableData,
      startY: 40
    });

    const inicio = new Date(fecha_inicio).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fin = new Date(fecha_fin).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fileName = `Gastos_${inicio}_al_${fin}.pdf`;

    await this.saveAndSharePdf(doc, fileName);
  }

  async generateIncomeReport(fecha_inicio: string, fecha_fin: string) {
    const ingresos: any[] = await firstValueFrom(
      this.dataService.getVentas().pipe(
        map((arr: any[]) => arr.filter(v => this.isInRange(v.fecha, fecha_inicio, fecha_fin)))
      )
    );
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Ingresos (Ventas)', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`,
      14,
      30
    );

    const tableData: RowInput[] = [];
    let total = 0;
    ingresos.forEach((v) => {
      const fecha = v.fecha ? new Date(v.fecha).toLocaleDateString('es-CL') : '';
      const comprador = v.nombre_comprador || v.comprador || 'Comprador';
      const monto = v.total_venta || v.monto || 0;
      total += monto;
      tableData.push([
        fecha,
        comprador,
        { content: `$${monto.toLocaleString('es-CL')}`, styles: { halign: 'right' } } as any
      ]);
    });

    tableData.push([
      { content: 'Total Ingresado', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } } as any,
      { content: `$${total.toLocaleString('es-CL')}`, styles: { halign: 'right', fontStyle: 'bold' } } as any
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Comprador', 'Monto']],
      body: tableData,
      startY: 40
    });

    const inicio = new Date(fecha_inicio).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fin = new Date(fecha_fin).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fileName = `Ingresos_${inicio}_al_${fin}.pdf`;

    await this.saveAndSharePdf(doc, fileName);
  }

  // --- FUNCIÓN CLAVE PARA CELULAR ---
  private async saveAndSharePdf(doc: jsPDF, fileName: string) {
    // Si estamos en PC (Web), usamos el método clásico
    if (!this.platform.is('capacitor')) {
      doc.save(fileName);
      return;
    }

    // Si estamos en Celular (Android/iOS), usamos Filesystem + Share
    try {
      // 1. Obtener el PDF como base64
      const base64Output = doc.output('datauristring');
      // Quitamos el prefijo "data:application/pdf;base64," para guardarlo
      const base64Data = base64Output.split(',')[1];

      // 2. Guardar en la caché del dispositivo
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache, // Usamos caché para no pedir permisos de almacenamiento complejos
      });

      // 3. Abrir el menú compartir nativo
      await Share.share({
        title: 'Reporte YouConApp',
        text: 'Aquí tienes el reporte generado.',
        url: result.uri, // Ruta del archivo local
        dialogTitle: 'Compartir PDF'
      });

    } catch (error) {
      console.error('Error al compartir PDF', error);
      throw error; // Para que el componente muestre el toast de error
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
}