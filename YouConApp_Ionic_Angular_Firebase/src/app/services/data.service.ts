import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, collectionData, query, where, runTransaction, orderBy, getDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

// --- Interfaces ---
export interface Trabajador { id?: string; nombre: string; apellido: string; saldo_acumulado: number; id_agricultor: string; estado: 'activo' | 'inactivo'; }
export interface Tarea { id?: string; id_trabajador: string; nombre_trabajador: string; fecha: string; tipo_tarea: string; pago_calculado: number; detalle_cosecha?: any; id_agricultor: string; id_cultivo?: string; nombre_cultivo?: string; }
export interface Pago { id?: string; id_trabajador: string; nombre_trabajador: string; monto: number; fecha: string; id_agricultor: string; }
export interface Cultivo { id?: string; nombre: string; descripcion: string; area: number; id_agricultor: string; estado: 'activo' | 'inactivo'; }
export interface Comprador { id?: string; nombre: string; saldo_deudor: number; id_agricultor: string; estado: 'activo' | 'inactivo'; }
export interface Venta { id?: string; id_comprador: string; nombre_comprador: string; fecha: string; items: { calidad: string; cantidad: number; precio_unitario: number }[]; total_venta: number; id_agricultor: string; }
export interface Gasto { id?: string; categoria: string; descripcion: string; monto: number; fecha: string; id_agricultor: string; }
export interface TaskFilters { fecha_inicio?: string; fecha_fin?: string; id_trabajador?: string; id_cultivo?: string; }
export interface Cobro { id?: string; id_comprador: string; nombre_comprador: string; monto: number; fecha: string; id_agricultor: string; }

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private firestore: Firestore, private authService: AuthService) { }

  private get uid() {
    const user = this.authService.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado.');
    return user.uid;
  }

  // --- CRUD para Trabajadores ---
  getTrabajadores = (): Observable<Trabajador[]> => this.authService.user$.pipe(switchMap(user => !user ? of([]) : collectionData(query(collection(this.firestore, 'trabajadores'), where("id_agricultor", "==", user.uid), where("estado", "==", "activo")), { idField: 'id' }) as Observable<Trabajador[]>));
  addTrabajador = (data: { nombre: string, apellido: string }) => addDoc(collection(this.firestore, 'trabajadores'), { ...data, saldo_acumulado: 0, id_agricultor: this.uid, estado: 'activo' });
  updateTrabajador = (id: string, data: Partial<Trabajador>) => updateDoc(doc(this.firestore, `trabajadores/${id}`), data);
  archiveTrabajador = (id: string) => updateDoc(doc(this.firestore, `trabajadores/${id}`), { estado: 'inactivo' });

  // --- CRUD para Compradores ---
  getCompradores = (): Observable<Comprador[]> => this.authService.user$.pipe(switchMap(user => !user ? of([]) : collectionData(query(collection(this.firestore, 'compradores'), where("id_agricultor", "==", user.uid), where("estado", "==", "activo")), { idField: 'id' }) as Observable<Comprador[]>));
  addComprador = (data: { nombre: string }) => addDoc(collection(this.firestore, 'compradores'), { ...data, saldo_deudor: 0, id_agricultor: this.uid, estado: 'activo' });
  updateComprador = (id: string, data: Partial<Comprador>) => updateDoc(doc(this.firestore, `compradores/${id}`), data);
  archiveComprador = (id: string) => updateDoc(doc(this.firestore, `compradores/${id}`), { estado: 'inactivo' });

  // --- CRUD para Cultivos ---
  getCultivos = (): Observable<Cultivo[]> => this.authService.user$.pipe(switchMap(user => !user ? of([]) : collectionData(query(collection(this.firestore, 'cultivos'), where("id_agricultor", "==", user.uid), where("estado", "==", "activo")), { idField: 'id' }) as Observable<Cultivo[]>));
  addCultivo = (data: Omit<Cultivo, 'id' | 'id_agricultor' | 'estado'>) => addDoc(collection(this.firestore, 'cultivos'), { ...data, id_agricultor: this.uid, estado: 'activo' });
  updateCultivo = (id: string, data: Partial<Cultivo>) => updateDoc(doc(this.firestore, `cultivos/${id}`), data);
  archiveCultivo = (id: string) => updateDoc(doc(this.firestore, `cultivos/${id}`), { estado: 'inactivo' });
  getCultivoById = async (id: string): Promise<Cultivo | null> => { const ref = doc(this.firestore, `cultivos/${id}`); const snap = await getDoc(ref); return snap.exists() ? { id: snap.id, ...snap.data() } as Cultivo : null; }

  // --- CRUD para Gastos ---
  getGastos = (): Observable<Gasto[]> => this.authService.user$.pipe(switchMap(user => !user ? of([]) : collectionData(query(collection(this.firestore, 'gastos'), where("id_agricultor", "==", user.uid)), { idField: 'id' }) as Observable<Gasto[]>));
  addGasto = (data: Omit<Gasto, 'id' | 'id_agricultor'>) => addDoc(collection(this.firestore, 'gastos'), { ...data, id_agricultor: this.uid });
  updateGasto = (id: string, data: Partial<Gasto>) => updateDoc(doc(this.firestore, `gastos/${id}`), data);
  deleteGasto = (id: string) => deleteDoc(doc(this.firestore, `gastos/${id}`));
  
  // --- CRUD para Ventas (Ingresos) ---
  getVentas = (): Observable<Venta[]> => this.authService.user$.pipe(switchMap(user => !user ? of([]) : collectionData(query(collection(this.firestore, 'ventas'), where("id_agricultor", "==", user.uid)), { idField: 'id' }) as Observable<Venta[]>));
  async addVentaAndUpdateBalance(venta: Omit<Venta, 'id'>) { const compradorDocRef = doc(this.firestore, `compradores/${venta.id_comprador}`); const ventasCollectionRef = collection(this.firestore, 'ventas'); await runTransaction(this.firestore, async (transaction) => { const compradorDoc = await transaction.get(compradorDocRef); if (!compradorDoc.exists()) throw "El comprador no existe."; const saldoAnterior = compradorDoc.data()['saldo_deudor']; const nuevoSaldo = saldoAnterior + venta.total_venta; transaction.update(compradorDocRef, { saldo_deudor: nuevoSaldo }); const nuevaVentaRef = doc(ventasCollectionRef); transaction.set(nuevaVentaRef, venta); }); }

  // --- Métodos de Tareas ---
  getTareas(filters: TaskFilters = {}): Observable<Tarea[]> { return this.authService.user$.pipe(switchMap(user => { if (!user) { return of([]); } const tareasRef = collection(this.firestore, 'tareas'); let queryConstraints = [ where("id_agricultor", "==", user.uid), orderBy("fecha", "desc") ]; if (filters.fecha_inicio) { queryConstraints.push(where("fecha", ">=", filters.fecha_inicio)); } if (filters.fecha_fin) { queryConstraints.push(where("fecha", "<=", filters.fecha_fin)); } if (filters.id_trabajador) { queryConstraints.push(where("id_trabajador", "==", filters.id_trabajador)); } if (filters.id_cultivo) { queryConstraints.push(where("id_cultivo", "==", filters.id_cultivo)); } const q = query(tareasRef, ...queryConstraints); return collectionData(q, { idField: 'id' }) as Observable<Tarea[]>; })); }
  async addTaskWithBalanceUpdate(tarea: Omit<Tarea, 'id'>) { const tDocRef = doc(this.firestore, `trabajadores/${tarea.id_trabajador}`); const taColRef = collection(this.firestore, 'tareas'); await runTransaction(this.firestore, async (t) => { const trDoc = await t.get(tDocRef); if (!trDoc.exists()) throw "Trabajador no existe."; const nS = trDoc.data()['saldo_acumulado'] + tarea.pago_calculado; t.update(tDocRef, { saldo_acumulado: nS }); const nTRef = doc(taColRef); t.set(nTRef, tarea); }); }
  async deleteTareaWithBalanceUpdate(tarea: Tarea) { const trabajadorDocRef = doc(this.firestore, `trabajadores/${tarea.id_trabajador}`); const tareaDocRef = doc(this.firestore, `tareas/${tarea.id!}`); await runTransaction(this.firestore, async (t) => { const trabajadorDoc = await t.get(trabajadorDocRef); if (trabajadorDoc.exists()) { const nuevoSaldo = trabajadorDoc.data()['saldo_acumulado'] - tarea.pago_calculado; t.update(trabajadorDocRef, { saldo_acumulado: nuevoSaldo }); } t.delete(tareaDocRef); }); }
  
  // --- Métodos de Pagos ---
  // ### INICIO DEL CAMBIO ###
  getPagos(filters: { fecha_inicio?: string; fecha_fin?: string } = {}): Observable<Pago[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) { return of([]); }
        
        const pagosRef = collection(this.firestore, 'pagos');
        let queryConstraints: any[] = [
          where("id_agricultor", "==", user.uid),
          orderBy("fecha", "desc")
        ];
        
        if (filters.fecha_inicio) {
          queryConstraints.push(where("fecha", ">=", filters.fecha_inicio));
        }
        if (filters.fecha_fin) {
          queryConstraints.push(where("fecha", "<=", filters.fecha_fin));
        }
        
        const q = query(pagosRef, ...queryConstraints);
        return collectionData(q, { idField: 'id' }) as Observable<Pago[]>;
      })
    );
  }
  // ### FIN DEL CAMBIO ###
  async addPaymentAndUpdateBalance(pago: Omit<Pago, 'id'>) { const tDocRef = doc(this.firestore, `trabajadores/${pago.id_trabajador}`); const pColRef = collection(this.firestore, 'pagos'); await runTransaction(this.firestore, async (t) => { const trDoc = await t.get(tDocRef); if (!trDoc.exists()) throw "Trabajador no existe."; const nS = trDoc.data()['saldo_acumulado'] - pago.monto; t.update(tDocRef, { saldo_acumulado: nS }); const nPRef = doc(pColRef); t.set(nPRef, pago); }); }
  async deletePagoWithBalanceUpdate(pago: Pago) { const trabajadorDocRef = doc(this.firestore, `trabajadores/${pago.id_trabajador}`); const pagoDocRef = doc(this.firestore, `pagos/${pago.id!}`); await runTransaction(this.firestore, async (t) => { const trabajadorDoc = await t.get(trabajadorDocRef); if (trabajadorDoc.exists()) { const nuevoSaldo = trabajadorDoc.data()['saldo_acumulado'] + pago.monto; t.update(trabajadorDocRef, { saldo_acumulado: nuevoSaldo }); } t.delete(pagoDocRef); }); }

  // --- Métodos para Cobros a Compradores ---
  getCobros = (id_comprador: string): Observable<Cobro[]> => this.authService.user$.pipe(switchMap(user => !user ? of([]) : collectionData(query(collection(this.firestore, 'cobros'), where("id_agricultor", "==", user.uid), where("id_comprador", "==", id_comprador), orderBy("fecha", "desc")), { idField: 'id' }) as Observable<Cobro[]>));
  async addCobroAndUpdateBalance(cobro: Omit<Cobro, 'id'>) { const cDocRef = doc(this.firestore, `compradores/${cobro.id_comprador}`); const coColRef = collection(this.firestore, 'cobros'); await runTransaction(this.firestore, async (t) => { const cDoc = await t.get(cDocRef); if (!cDoc.exists()) throw "Comprador no existe."; const nS = cDoc.data()['saldo_deudor'] - cobro.monto; t.update(cDocRef, { saldo_deudor: nS }); const nCRef = doc(coColRef); t.set(nCRef, cobro); }); }
}