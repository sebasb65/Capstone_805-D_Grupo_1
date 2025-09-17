import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { DataService, Cultivo, Tarea } from '../../services/data.service';

@Component({
  selector: 'app-cultivo-detail',
  templateUrl: './cultivo-detail.page.html',
  styleUrls: ['./cultivo-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class CultivoDetailPage implements OnInit {

  cultivo: Cultivo | null = null;
  filterForm: FormGroup;

  private filters$ = new BehaviorSubject<{fecha_inicio?: string; fecha_fin?: string}>({});

  tareasFiltradas$: Observable<Tarea[]>;
  costoTotal$: Observable<number>;
  produccionTotal$: Observable<any[]>;

  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  constructor() {
    this.filterForm = this.fb.group({
      fecha_inicio: [null],
      fecha_fin: [null],
    });

    this.tareasFiltradas$ = combineLatest([
      this.route.paramMap,
      this.filters$
    ]).pipe(
      switchMap(([params, filters]) => {
        const cultivoId = params.get('id');
        if (!cultivoId) return [];
        const allFilters = { ...filters, id_cultivo: cultivoId };
        return this.dataService.getTareas(allFilters);
      })
    );

    this.costoTotal$ = this.tareasFiltradas$.pipe(
      map(tareas => tareas.reduce((total, tarea) => total + tarea.pago_calculado, 0))
    );

    this.produccionTotal$ = this.tareasFiltradas$.pipe(
      map(tareas => {
        const produccion = new Map<string, number>();
        tareas.forEach(tarea => {
          if (tarea.tipo_tarea === 'Cosecha' && tarea.detalle_cosecha) {
            tarea.detalle_cosecha.forEach((detalle: any) => {
              const calidad = detalle.calidad || 'Sin Calidad';
              const cantidadActual = produccion.get(calidad) || 0;
              produccion.set(calidad, cantidadActual + (detalle.cantidad || 0));
            });
          }
        });
        return Array.from(produccion.entries()).map(([calidad, cantidad]) => ({ calidad, cantidad }));
      })
    );
  }

  async ngOnInit() {
    const cultivoId = this.route.snapshot.paramMap.get('id');
    if (cultivoId) {
      this.cultivo = await this.dataService.getCultivoById(cultivoId);
    }

    this.filterForm.valueChanges.subscribe(formValue => {
      this.filters$.next({
        fecha_inicio: formValue.fecha_inicio?.split('T')[0],
        fecha_fin: formValue.fecha_fin?.split('T')[0],
      });
    });
  }

  limpiarFiltros() {
    this.filterForm.reset();
  }
}