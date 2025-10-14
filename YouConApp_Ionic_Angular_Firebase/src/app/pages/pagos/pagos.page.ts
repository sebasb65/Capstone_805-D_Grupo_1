import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators'; // <-- CORRECCIÓN EN EL IMPORT
import { DataService, Trabajador, Pago } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  providers: [DatePipe]
})
export class PagosPage implements OnInit {
  pagoForm: FormGroup;
  trabajadores$: Observable<Trabajador[]>;
  historialPagos$: Observable<Pago[]>;
  private userId: string | null = null;

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private datePipe = inject(DatePipe);

  constructor() {
    this.trabajadores$ = this.dataService.getTrabajadores();
    this.historialPagos$ = this.dataService.getPagos().pipe(startWith([]));
    this.authService.user$.subscribe(user => this.userId = user ? user.uid : null);

    this.pagoForm = this.fb.group({
      trabajador: [null, Validators.required],
      monto: [null, [Validators.required, Validators.min(1)]],
      fecha: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    });
  }

  ngOnInit() { }

  async registrarPago() {
    if (this.pagoForm.invalid || !this.userId) return;
    const loading = await this.loadingCtrl.create({ message: 'Registrando pago...' });
    await loading.present();

    const formValue = this.pagoForm.value;
    const trabajadorSeleccionado: Trabajador = formValue.trabajador;

    const nuevoPago: Omit<Pago, 'id'> = {
      id_trabajador: trabajadorSeleccionado.id!,
      nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
      monto: formValue.monto,
      fecha: formValue.fecha,
      id_agricultor: this.userId
    };

    try {
      await this.dataService.addPaymentAndUpdateBalance(nuevoPago);
      await loading.dismiss();
      this.presentToast('Pago registrado con éxito.', 'success');
      this.pagoForm.reset({ fecha: this.datePipe.transform(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      await loading.dismiss();
      this.presentToast('Error al registrar el pago.', 'danger');
    }
  }

  async confirmDelete(pago: Pago) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Seguro que quieres eliminar este pago? El monto se devolverá al saldo del trabajador.',
      buttons: [ { text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive', handler: () => this.deletePago(pago) } ]
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