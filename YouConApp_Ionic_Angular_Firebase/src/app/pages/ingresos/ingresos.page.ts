import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Comprador, Venta } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class IngresosPage implements OnInit {
  
  ventaForm: FormGroup;
  compradores$: Observable<Comprador[]>;
  private userId: string | null = null;

  private fb = inject(FormBuilder);
  private dataService = inject(DataService); 
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController); 
  private loadingCtrl = inject(LoadingController);
  private router = inject(Router);

  constructor() {
    this.compradores$ = this.dataService.getCompradores();
    
    // --- CAMBIO CRÍTICO ---
    this.dataService.ownerUid$.subscribe(uid => this.userId = uid);
    
    this.ventaForm = this.fb.group({
      comprador: [null, Validators.required], 
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      items: this.fb.array([], Validators.required)
    });
  }

  ngOnInit() { 
    this.addItem();
  }

  get items(): FormArray { 
    return this.ventaForm.get('items') as FormArray;
  }

  addItem() {
    const itemGroup = this.fb.group({
      calidad: ['', Validators.required], 
      cantidad: ['', Validators.required], 
      precio_unitario: ['', Validators.required] 
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number) { 
    this.items.removeAt(index);
  }

  formatMonto(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, '');
    if (valor.length > 0) {
      valor = new Intl.NumberFormat('es-CL').format(parseInt(valor, 10));
    }
    event.target.value = valor;
  }

  async registrarVenta() {
    if (this.ventaForm.invalid || !this.userId) return;

    const loading = await this.loadingCtrl.create({ message: 'Registrando venta...' });
    await loading.present();

    try {
      const formValue = this.ventaForm.value;
      const compradorSeleccionado: Comprador = formValue.comprador;

      const itemsLimpios = formValue.items.map((item: any) => {
        const cantidadLimpia = parseInt(item.cantidad.toString().replace(/\./g, ''), 10);
        const precioLimpio = parseInt(item.precio_unitario.toString().replace(/\./g, ''), 10);
        return {
          calidad: item.calidad,
          cantidad: cantidadLimpia,
          precio_unitario: precioLimpio
        };
      });

      const totalVenta = itemsLimpios.reduce(
        (total: number, item: any) => total + (item.cantidad * item.precio_unitario), 
        0
      );

      const nuevaVenta: Omit<Venta, 'id'> = {
        id_comprador: compradorSeleccionado.id!, 
        nombre_comprador: compradorSeleccionado.nombre, 
        fecha: formValue.fecha, 
        items: itemsLimpios, 
        total_venta: totalVenta, 
        id_agricultor: this.userId // ID correcto
      };

      await this.dataService.addVentaAndUpdateBalance(nuevaVenta);
      
      this.presentToast('Venta registrada con éxito.', 'success');
      this.router.navigate(['/home']);

    } catch (e) {
      this.presentToast('Error al registrar la venta.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ 
      message, 
      duration: 2000, 
      color, 
      position: 'top' 
    });
    toast.present();
  }
}