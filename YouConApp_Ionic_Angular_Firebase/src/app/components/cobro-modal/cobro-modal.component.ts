import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { DataService, Comprador, Cobro } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cobro-modal',
  templateUrl: './cobro-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  providers: [DatePipe]
})
export class CobroModalComponent implements OnInit {
  @Input() comprador!: Comprador; // Recibimos el comprador al que se le hará el cobro
  cobroForm: FormGroup;
  private userId: string | null = null;

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private datePipe = inject(DatePipe);

  constructor() {
    this.authService.user$.subscribe(user => this.userId = user ? user.uid : null);
    this.cobroForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(1)]],
      fecha: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    });
  }

  ngOnInit() {
    // Podemos pre-llenar el monto con la deuda total si queremos
    // this.cobroForm.patchValue({ monto: this.comprador.saldo_deudor });
  }

  dismiss = () => this.modalCtrl.dismiss();

  async submitForm() {
    if (this.cobroForm.invalid || !this.userId) return;

    const loading = await this.loadingCtrl.create({ message: 'Registrando cobro...' });
    await loading.present();

    const formValue = this.cobroForm.value;
    const nuevoCobro: Omit<Cobro, 'id'> = {
      id_comprador: this.comprador.id!,
      nombre_comprador: this.comprador.nombre,
      monto: formValue.monto,
      fecha: formValue.fecha,
      id_agricultor: this.userId
    };

    try {
      await this.dataService.addCobroAndUpdateBalance(nuevoCobro);
      await loading.dismiss();
      this.presentToast('Cobro registrado con éxito.', 'success');
      this.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.presentToast('Error al registrar el cobro.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}