import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { DataService, Comprador, Cobro } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cobro-modal',
  templateUrl: './cobro-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class CobroModalComponent implements OnInit {
  @Input() comprador!: Comprador;
  
  cobroForm: FormGroup;
  private userId: string | null = null;
  maxDate: string = new Date().toISOString().split('T')[0];

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  
  constructor() {
    // --- CAMBIO CRÍTICO ---
    this.dataService.ownerUid$.subscribe(uid => this.userId = uid);
    
    this.cobroForm = this.fb.group({
      monto: ['', Validators.required], 
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  ngOnInit() {}

  formatMonto(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, ''); 
    if (valor.length > 0) {
      valor = new Intl.NumberFormat('es-CL').format(parseInt(valor, 10));
    }
    event.target.value = valor;
  }

  dismiss = () => this.modalCtrl.dismiss();

  async submitForm() {
    if (this.cobroForm.invalid || !this.userId) return;
    
    const loading = await this.loadingCtrl.create({ message: 'Registrando cobro...' });
    await loading.present();

    try {
      const formValue = this.cobroForm.value;
      const montoLimpio = parseInt(formValue.monto.toString().replace(/\./g, ''), 10);
      
      const nuevoCobro: Omit<Cobro, 'id'> = {
        id_comprador: this.comprador.id!,
        nombre_comprador: this.comprador.nombre,
        monto: montoLimpio, 
        fecha: formValue.fecha,
        id_agricultor: this.userId // ID correcto
      };

      await this.dataService.addCobroAndUpdateBalance(nuevoCobro);
      
      this.presentToast('Cobro registrado con éxito.', 'success');
      this.dismiss();
      
    } catch (error) {
      this.presentToast('Error al registrar el cobro.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}