import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  collectionData,
  query,
  where,
  runTransaction,
  orderBy,
  getDoc
} from '@angular/fire/firestore';
// Importamos firstValueFrom para manejar promesas de Observables
import { Observable, of, firstValueFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// ====== Interfaces ======

export interface Trabajador {
  id?: string;
  nombre: string;
  apellido: string;
  saldo_acumulado: number;
  id_agricultor: string;
  estado: 'activo' | 'inactivo';
}

export interface Tarea {
  id?: string;
  id_trabajador: string;
  nombre_trabajador: string;
  fecha: string;
  tipo_tarea: string;
  pago_calculado: number;
  detalle_cosecha?: any;
  id_agricultor: string;
  id_cultivo?: string;
  nombre_cultivo?: string;
}

export interface Pago {
  id?: string;
  id_trabajador: string;
  nombre_trabajador: string;
  monto: number;
  fecha: string;
  id_agricultor: string;
  createdAt?: any; // Importante para el ordenamiento exacto
}

export interface Cultivo {
  id?: string;
  nombre: string;
  descripcion: string;
  area: number;
  id_agricultor: string;
  estado: 'activo' | 'inactivo';
}

export interface Comprador {
  id?: string;
  nombre: string;
  saldo_deudor: number;
  id_agricultor: string;
  estado: 'activo' | 'inactivo';
}

export interface Venta {
  id?: string;
  id_comprador: string;
  nombre_comprador: string;
  fecha: string;
  items: { calidad: string; cantidad: number; precio_unitario: number }[];
  total_venta: number;
  id_agricultor: string;
}

export interface Gasto {
  id?: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  id_agricultor: string;
}

export interface TaskFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_trabajador?: string;
  id_cultivo?: string;
}

export interface Cobro {
  id?: string;
  id_comprador: string;
  nombre_comprador: string;
  monto: number;
  fecha: string;
  id_agricultor: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) { }

  // ==== LOGICA DE DUEÑO (MULTI-TENANCY) ====
  
  // Observable público que devuelve el ID del Agricultor (Jefe)
  // Si soy Admin, devuelve mi ID. Si soy Supervisor, devuelve el ID de mi Jefe.
  public ownerUid$ = this.authService.appUser$.pipe(
    map((appUser: any) => {
      if (!appUser) return null;
      if (appUser.rol === 'standard' && appUser.adminUid) {
        return appUser.adminUid;
      }
      return appUser.uid;
    })
  );

  // Función auxiliar para obtener el ID del dueño al momento de guardar (Promesa)
  private async getOwnerId(): Promise<string> {
    const uid = await firstValueFrom(this.ownerUid$);
    if (!uid) throw new Error('No se pudo identificar al dueño de la cuenta.');
    return uid;
  }

  // ==== CRUD de Trabajadores ====
  getTrabajadores = (): Observable<Trabajador[]> =>
    this.ownerUid$.pipe(
      switchMap(ownerUid =>
        !ownerUid
          ? of([])
          : collectionData(
              query(
                collection(this.firestore, 'trabajadores'),
                where('id_agricultor', '==', ownerUid),
                where('estado', '==', 'activo')
              ),
              { idField: 'id' }
            ) as Observable<Trabajador[]>
      )
    );

  // Guardar a nombre del dueño
  addTrabajador = async (data: { nombre: string; apellido: string }) => {
    const ownerId = await this.getOwnerId();
    return addDoc(collection(this.firestore, 'trabajadores'), {
      ...data,
      saldo_acumulado: 0,
      id_agricultor: ownerId,
      estado: 'activo'
    });
  }

  updateTrabajador = (id: string, data: Partial<Trabajador>) =>
    updateDoc(doc(this.firestore, `trabajadores/${id}`), data);

  archiveTrabajador = (id: string) =>
    updateDoc(doc(this.firestore, `trabajadores/${id}`), { estado: 'inactivo' });

  // ==== CRUD de Compradores ====
  getCompradores = (): Observable<Comprador[]> =>
    this.ownerUid$.pipe(
      switchMap(ownerUid =>
        !ownerUid
          ? of([])
          : collectionData(
              query(
                collection(this.firestore, 'compradores'),
                where('id_agricultor', '==', ownerUid),
                where('estado', '==', 'activo')
              ),
              { idField: 'id' }
            ) as Observable<Comprador[]>
      )
    );

  // Guardar a nombre del dueño
  addComprador = async (data: { nombre: string }) => {
    const ownerId = await this.getOwnerId();
    return addDoc(collection(this.firestore, 'compradores'), {
      ...data,
      saldo_deudor: 0,
      id_agricultor: ownerId,
      estado: 'activo'
    });
  }

  updateComprador = (id: string, data: Partial<Comprador>) =>
    updateDoc(doc(this.firestore, `compradores/${id}`), data);

  archiveComprador = (id: string) =>
    updateDoc(doc(this.firestore, `compradores/${id}`), { estado: 'inactivo' });

  // ==== CRUD de Cultivos ====
  getCultivos = (): Observable<Cultivo[]> =>
    this.ownerUid$.pipe(
      switchMap(ownerUid =>
        !ownerUid
          ? of([])
          : collectionData(
              query(
                collection(this.firestore, 'cultivos'),
                where('id_agricultor', '==', ownerUid),
                where('estado', '==', 'activo')
              ),
              { idField: 'id' }
            ) as Observable<Cultivo[]>
      )
    );

  // Guardar a nombre del dueño
  addCultivo = async (data: Omit<Cultivo, 'id' | 'id_agricultor' | 'estado'>) => {
    const ownerId = await this.getOwnerId();
    return addDoc(collection(this.firestore, 'cultivos'), {
      ...data,
      id_agricultor: ownerId,
      estado: 'activo'
    });
  }

  updateCultivo = (id: string, data: Partial<Cultivo>) =>
    updateDoc(doc(this.firestore, `cultivos/${id}`), data);

  archiveCultivo = (id: string) =>
    updateDoc(doc(this.firestore, `cultivos/${id}`), { estado: 'inactivo' });

  getCultivoById = async (id: string): Promise<Cultivo | null> => {
    const ref = doc(this.firestore, `cultivos/${id}`);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Cultivo) : null;
  };

  // ==== CRUD de Gastos ====
  getGastos = (): Observable<Gasto[]> =>
    this.ownerUid$.pipe(
      switchMap(ownerUid =>
        !ownerUid
          ? of([])
          : collectionData(
              query(
                collection(this.firestore, 'gastos'),
                where('id_agricultor', '==', ownerUid)
              ),
              { idField: 'id' }
            ) as Observable<Gasto[]>
      )
    );

  // Guardar a nombre del dueño
  addGasto = async (data: Omit<Gasto, 'id' | 'id_agricultor'>) => {
    const ownerId = await this.getOwnerId();
    return addDoc(collection(this.firestore, 'gastos'), {
      ...data,
      id_agricultor: ownerId
    });
  }

  updateGasto = (id: string, data: Partial<Gasto>) =>
    updateDoc(doc(this.firestore, `gastos/${id}`), data);

  deleteGasto = (id: string) =>
    deleteDoc(doc(this.firestore, `gastos/${id}`));

  // ==== Ventas e Ingresos ====
  getVentas = (): Observable<Venta[]> =>
    this.ownerUid$.pipe(
      switchMap(ownerUid =>
        !ownerUid
          ? of([])
          : collectionData(
              query(
                collection(this.firestore, 'ventas'),
                where('id_agricultor', '==', ownerUid)
              ),
              { idField: 'id' }
            ) as Observable<Venta[]>
      )
    );

  // Transacción de Venta (La página ya envía el id_agricultor correcto)
  async addVentaAndUpdateBalance(venta: Omit<Venta, 'id'>) {
    const compradorDocRef = doc(this.firestore, `compradores/${venta.id_comprador}`);
    const ventasCollectionRef = collection(this.firestore, 'ventas');

    await runTransaction(this.firestore, async (transaction) => {
      const compradorDoc = await transaction.get(compradorDocRef);
      if (!compradorDoc.exists()) throw 'El comprador no existe.';

      const saldoAnterior = compradorDoc.data()['saldo_deudor'];
      const nuevoSaldo = saldoAnterior + venta.total_venta;

      transaction.update(compradorDocRef, { saldo_deudor: nuevoSaldo });
      const nuevaVentaRef = doc(ventasCollectionRef);
      transaction.set(nuevaVentaRef, venta);
    });
  }

  // ==== Tareas ====
  getTareas(filters: TaskFilters = {}): Observable<Tarea[]> {
    return this.ownerUid$.pipe(
      switchMap(ownerUid => {
        if (!ownerUid) return of([]);

        const tareasRef = collection(this.firestore, 'tareas');
        const queryConstraints: any[] = [
          where('id_agricultor', '==', ownerUid),
          orderBy('fecha', 'desc')
        ];

        if (filters.fecha_inicio) queryConstraints.push(where('fecha', '>=', filters.fecha_inicio));
        if (filters.fecha_fin) queryConstraints.push(where('fecha', '<=', filters.fecha_fin));
        if (filters.id_trabajador) queryConstraints.push(where('id_trabajador', '==', filters.id_trabajador));
        if (filters.id_cultivo) queryConstraints.push(where('id_cultivo', '==', filters.id_cultivo));

        const q = query(tareasRef, ...queryConstraints);
        return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>;
      })
    );
  }

  async addTaskWithBalanceUpdate(tarea: Omit<Tarea, 'id'>) {
    const tDocRef = doc(this.firestore, `trabajadores/${tarea.id_trabajador}`);
    const taColRef = collection(this.firestore, 'tareas');

    await runTransaction(this.firestore, async (t) => {
      const trDoc = await t.get(tDocRef);
      if (!trDoc.exists()) throw 'Trabajador no existe.';

      const nS = trDoc.data()['saldo_acumulado'] + tarea.pago_calculado;
      t.update(tDocRef, { saldo_acumulado: nS });

      const nTRef = doc(taColRef);
      t.set(nTRef, tarea);
    });
  }

  async deleteTareaWithBalanceUpdate(tarea: Tarea) {
    const trabajadorDocRef = doc(this.firestore, `trabajadores/${tarea.id_trabajador}`);
    const tareaDocRef = doc(this.firestore, `tareas/${tarea.id!}`);

    await runTransaction(this.firestore, async (t) => {
      const trabajadorDoc = await t.get(trabajadorDocRef);
      if (trabajadorDoc.exists()) {
        const nuevoSaldo = trabajadorDoc.data()['saldo_acumulado'] - tarea.pago_calculado;
        t.update(trabajadorDocRef, { saldo_acumulado: nuevoSaldo });
      }
      t.delete(tareaDocRef);
    });
  }

  // ==== PAGOS (CORREGIDO: TIPO Y ORDENAMIENTO) ====
  getPagos(filters: { fecha_inicio?: string; fecha_fin?: string } = {}): Observable<Pago[]> {
    return this.ownerUid$.pipe(
      switchMap(ownerUid => {
        if (!ownerUid) return of([]);

        const pagosRef = collection(this.firestore, 'pagos');
        
        // 1. Consulta ordenada por fecha
        const queryConstraints: any[] = [
          where('id_agricultor', '==', ownerUid),
          orderBy('fecha', 'desc')
        ];

        if (filters.fecha_inicio) queryConstraints.push(where('fecha', '>=', filters.fecha_inicio));
        if (filters.fecha_fin) queryConstraints.push(where('fecha', '<=', filters.fecha_fin));

        const q = query(pagosRef, ...queryConstraints);
        
        // 2. FIX: Forzamos el tipo a Observable<Pago[]> antes del pipe
        return (collectionData(q, { idField: 'id' }) as Observable<Pago[]>).pipe(
            map((pagos) => {
                // 3. Ordenamiento fino en cliente
                return pagos.sort((a, b) => {
                    if (a.fecha !== b.fecha) return a.fecha > b.fecha ? -1 : 1;
                    // Desempate con createdAt
                    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return tB - tA;
                });
            })
        );
      })
    );
  }

  async addPaymentAndUpdateBalance(pago: Omit<Pago, 'id'>) {
    const tDocRef = doc(this.firestore, `trabajadores/${pago.id_trabajador}`);
    const pColRef = collection(this.firestore, 'pagos');

    await runTransaction(this.firestore, async (t) => {
      const trDoc = await t.get(tDocRef);
      if (!trDoc.exists()) throw 'Trabajador no existe.';

      const nS = trDoc.data()['saldo_acumulado'] - pago.monto;
      t.update(tDocRef, { saldo_acumulado: nS });

      const nPRef = doc(pColRef);
      t.set(nPRef, { ...pago, createdAt: new Date().toISOString() });
    });
  }

  async deletePagoWithBalanceUpdate(pago: Pago) {
    const trabajadorDocRef = doc(this.firestore, `trabajadores/${pago.id_trabajador}`);
    const pagoDocRef = doc(this.firestore, `pagos/${pago.id!}`);

    await runTransaction(this.firestore, async (t) => {
      const trabajadorDoc = await t.get(trabajadorDocRef);
      if (trabajadorDoc.exists()) {
        const nuevoSaldo = trabajadorDoc.data()['saldo_acumulado'] + pago.monto;
        t.update(trabajadorDocRef, { saldo_acumulado: nuevoSaldo });
      }
      t.delete(pagoDocRef);
    });
  }

  // ==== Cobros ====
  getCobros = (id_comprador: string): Observable<Cobro[]> =>
    this.ownerUid$.pipe(
      switchMap(ownerUid =>
        !ownerUid
          ? of([])
          : collectionData(
              query(
                collection(this.firestore, 'cobros'),
                where('id_agricultor', '==', ownerUid),
                where('id_comprador', '==', id_comprador),
                orderBy('fecha', 'desc')
              ),
              { idField: 'id' }
            ) as Observable<Cobro[]>
      )
    );

  async addCobroAndUpdateBalance(cobro: Omit<Cobro, 'id'>) {
    const cDocRef = doc(this.firestore, `compradores/${cobro.id_comprador}`);
    const coColRef = collection(this.firestore, 'cobros');

    await runTransaction(this.firestore, async (t) => {
      const cDoc = await t.get(cDocRef);
      if (!cDoc.exists()) throw 'Comprador no existe.';

      const nS = cDoc.data()['saldo_deudor'] - cobro.monto;
      t.update(cDocRef, { saldo_deudor: nS });

      const nCRef = doc(coColRef);
      t.set(nCRef, cobro);
    });
  }

  // ==== Supervisores (Solo Admin) ====
  getSupervisoresByAdmin(adminUid: string): Observable<any[]> {
    const colRef = collection(this.firestore, 'supervisores');
    const q = query(colRef, where('adminUid', '==', adminUid));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  addSupervisor(data: { nombre: string; email: string; telefono?: string; adminUid: string; }) {
    // Los supervisores siempre se crean ligados al usuario actual (que es Admin)
    return addDoc(collection(this.firestore, 'supervisores'), {
      ...data,
      createdAt: new Date()
    });
  }

  deleteSupervisor(id: string) {
    const docRef = doc(this.firestore, 'supervisores', id);
    return deleteDoc(docRef);
  }
}