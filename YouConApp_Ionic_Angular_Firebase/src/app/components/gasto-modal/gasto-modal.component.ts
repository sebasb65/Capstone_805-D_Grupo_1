import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { DataService, Gasto } from '../../services/data.service';

@Component({
  selector: 'app-gasto-modal',
  templateUrl: './gasto-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class GastoModalComponent implements OnInit {
  @Input() gasto?: Gasto;
  gastoForm: FormGroup;
  isEditMode = false;

  categoriasGasto = [
    'Insumos', 'Arriendo', 'Combustible', 'Reparaciones', 
    'Transporte', 'Servicios (Luz, Agua)', 'Químicos', 'Materiales', 'Otro'
  ];

  constructor(
    private modalCtrl: ModalController,
    private dataService: DataService,
    private toastCtrl: ToastController,
    private fb: FormBuilder
  ) {
    this.gastoForm = this.fb.group({
      categoria: [null, Validators.required],
      descripcion: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(1)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit() {
    if (this.gasto) {
      this.isEditMode = true;
      this.gastoForm.patchValue(this.gasto);
    }
  }

  dismiss = () => this.modalCtrl.dismiss();

  async submitForm() {
    if (this.gastoForm.invalid) return;

    try {
      const gastoData = { ...this.gastoForm.value, id_agricultor: this.dataService['uid'] };
      if (this.isEditMode && this.gasto) {
        await this.dataService.updateGasto(this.gasto.id!, gastoData);
      } else {
        await this.dataService.addGasto(gastoData);
      }
      this.presentToast(`Gasto ${this.isEditMode ? 'actualizado' : 'registrado'} con éxito.`, 'success');
      this.dismiss();
    } catch (error) {
      this.presentToast('Error al guardar el gasto.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}