// Importaciones de Angular, utilidades JS y librerías PDF/AutoTable
import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
// Servicios y utilidades para consumir datos e RxJS
import { DataService } from './data.service';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Servicio para generar reportes en PDF usando jsPDF y autoTable.
 * Los reportes incluyen Pagos, Gastos e Ingresos (Ventas), con rango de fechas.
 */
@Injectable({
  providedIn: 'root'
})
export class PdfReportService {
  /**
   * Inyección del servicio de datos usando el patrón inject()
   */
  private dataService = inject(DataService);

  constructor() {}

  /**
   * Genera y descarga un PDF de pagos a trabajadores para un período dado
   */
  async generatePaymentReport(fecha_inicio: string, fecha_fin: string) {
    // 1. Consulta los pagos en el período específico
    const pagos: any[] = await firstValueFrom(
      this.dataService.getPagos({ fecha_inicio, fecha_fin })
    );

    const doc = new jsPDF();

    // 2. Encabezado del PDF
    doc.setFontSize(18);
    doc.text('Reporte de Pagos a Trabajadores', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`,
      14,
      30
    );

    // 3. Prepara datos de la tabla
    const tableData: RowInput[] = [];
    let total = 0;

    pagos.forEach((p) => {
      const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-CL') : '';
      const nombre = p.nombre_trabajador || p.nombre || 'Trabajador';
      const monto = p.monto || 0;
      total += monto;

      // Se agrega cada fila
      tableData.push([
        fecha,
        nombre,
        { content: `$${monto.toLocaleString('es-CL')}`, styles: { halign: 'right' } } as any
      ]);
    });

    // 4. Fila de total al final
    tableData.push([
      { content: 'Total Pagado', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } } as any,
      { content: `$${total.toLocaleString('es-CL')}`, styles: { halign: 'right', fontStyle: 'bold' } } as any
    ]);

    // 5. Renderiza tabla con autoTable
    autoTable(doc, {
      head: [['Fecha', 'Trabajador', 'Monto']],
      body: tableData,
      startY: 40
    });

    // 6. Nombre del archivo (incluyendo rango de fechas)
    const inicio = new Date(fecha_inicio).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fin = new Date(fecha_fin).toLocaleDateString('es-CL').replace(/\//g, '-');
    const fileName = `Pagos_Trabajadores_${inicio}_al_${fin}.pdf`;

    // 7. Descarga el PDF generado
    doc.save(fileName);
  }

  /**
   * Genera y descarga un PDF de gastos para el rango de fechas especificado
   */
  async generateExpenseReport(fecha_inicio: string, fecha_fin: string) {
    // 1. Consulta los gastos en el rango usando un filtro personalizado
    const gastos: any[] = await firstValueFrom(
      this.dataService.getGastos().pipe(
        map((arr: any[]) => arr.filter(g => this.isInRange(g.fecha, fecha_inicio, fecha_fin)))
      )
    );

    const doc = new jsPDF();

    // 2. Encabezado
    doc.setFontSize(18);
    doc.text('Reporte de Gastos', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`,
      14,
      30
    );

    // 3. Cuerpo de la tabla
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

    // 4. Total al final
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

    doc.save(fileName);
  }

  /**
   * Genera y descarga un PDF de ingresos (ventas) en un intervalo de fechas
   */
  async generateIncomeReport(fecha_inicio: string, fecha_fin: string) {
    // 1. Consulta las ventas/ingresos del período filtrando manualmente
    const ingresos: any[] = await firstValueFrom(
      this.dataService.getVentas().pipe(
        map((arr: any[]) => arr.filter(v => this.isInRange(v.fecha, fecha_inicio, fecha_fin)))
      )
    );

    const doc = new jsPDF();

    // 2. Encabezado
    doc.setFontSize(18);
    doc.text('Reporte de Ingresos (Ventas)', 14, 22);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`,
      14,
      30
    );

    // 3. Datos de tabla y acumulador de total
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

    // 4. Total al final
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

    doc.save(fileName);
  }

  /**
   * Utilidad para saber si una fecha (YYYY-MM-DD) está dentro del rango seleccionado
   */
  private isInRange(fecha: string, inicio: string, fin: string): boolean {
    if (!fecha) return false;

    const f = new Date(fecha);
    const fi = new Date(inicio);
    const ff = new Date(fin);

    // Ajusta los límites para incluir días completos
    fi.setHours(0, 0, 0, 0);
    ff.setHours(23, 59, 59, 999);

    return f >= fi && f <= ff;
  }
}
