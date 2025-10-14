import { Injectable, inject } from '@angular/core';
import * as jsPDF from 'jspdf'; // <-- ESTE ES EL CAMBIO
import 'jspdf-autotable';
import { DataService } from './data.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {
  private dataService = inject(DataService);

  constructor() { }

  async generatePaymentReport(fecha_inicio: string, fecha_fin: string) {
    const pagos = await firstValueFrom(this.dataService.getPagos({ fecha_inicio, fecha_fin }));
    
    // Al usar "import * as jsPDF", debemos instanciarlo así:
    const doc = new (jsPDF as any).default();
    
    doc.setFontSize(18);
    doc.text('Reporte de Pagos a Trabajadores', 14, 22);
    doc.setFontSize(11);
    doc.text(`Periodo: ${new Date(fecha_inicio).toLocaleDateString('es-CL')} al ${new Date(fecha_fin).toLocaleDateString('es-CL')}`, 14, 30);

    const tableData = pagos.map(p => [
      new Date(p.fecha).toLocaleDateString('es-CL'),
      p.nombre_trabajador,
      { content: `$${p.monto.toLocaleString('es-CL')}`, styles: { halign: 'right' } }
    ]);

    const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    
    tableData.push([
        { content: 'Total Pagado', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } } as any,
        { content: `$${totalPagado.toLocaleString('es-CL')}`, styles: { halign: 'right', fontStyle: 'bold' } } as any
    ]);

    (doc as any).autoTable({
      head: [['Fecha', 'Trabajador', 'Monto']],
      body: tableData,
      startY: 40,
    });

    doc.output('dataurlnewwindow');
  }
}