import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { DataService, Trabajador, Pago } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class PagosPage implements OnInit {
  
  pagoForm: FormGroup;
  trabajadores$: Observable<Trabajador[]>;
  historialPagos$: Observable<Pago[]>;
  private userId: string | null = null;
  maxDate: string = new Date().toISOString().split('T')[0];

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);

  constructor() {
    this.trabajadores$ = this.dataService.getTrabajadores();
    this.historialPagos$ = this.dataService.getPagos().pipe(startWith([]));
    
    // --- CAMBIO CRÍTICO ---
    this.dataService.ownerUid$.subscribe(uid => this.userId = uid);

    this.pagoForm = this.fb.group({
      trabajador: [null, Validators.required],
      monto: ['', Validators.required], 
      fecha: [new Date().toISOString().split('T')[0], Validators.required], 
    });
  }

  ngOnInit() { }

  formatMonto(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, ''); 
    if (valor.length > 0) {
      valor = new Intl.NumberFormat('es-CL').format(parseInt(valor, 10));
    }
    event.target.value = valor;
  }

  async registrarPago() {
    if (this.pagoForm.invalid || !this.userId) return;

    const loading = await this.loadingController.create({ message: 'Registrando pago...' });
    await loading.present();

    try {
      const formValue = this.pagoForm.value;
      const trabajadorSeleccionado: Trabajador = formValue.trabajador;

      const montoLimpio = parseInt(formValue.monto.toString().replace(/\./g, ''), 10);

      const nuevoPago: Omit<Pago, 'id'> = {
        id_trabajador: trabajadorSeleccionado.id!,
        nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
        monto: montoLimpio, 
        fecha: formValue.fecha,
        id_agricultor: this.userId // ID correcto
      };

      await this.dataService.addPaymentAndUpdateBalance(nuevoPago);
      this.presentToast('Pago registrado con éxito.', 'success');
      
      this.pagoForm.reset({ 
        fecha: new Date().toISOString().split('T')[0] 
      });

    } catch (error) {
      this.presentToast('Error al registrar el pago.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  get loadingController() { return this.loadingCtrl; }

  async confirmDelete(pago: Pago) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Seguro que quieres eliminar este pago? El monto se devolverá al saldo del trabajador.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: () => this.deletePago(pago)
        }
      ]
    });
    await alert.present();
  }

  private async deletePago(pago: Pago) {
    try {
      await this.dataService.deletePagoWithBalanceUpdate(pago);
      this.presentToast('Pago eliminado con éxito.', 'success');
    } catch (error) {
      this.presentToast('Error al eliminar el pago.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}