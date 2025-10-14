import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { DataService, Comprador } from '../../services/data.service';

@Component({
  selector: 'app-comprador-modal',
  templateUrl: './comprador-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class CompradorModalComponent implements OnInit {
  @Input() comprador?: Comprador;
  compradorForm: FormGroup;
  isEditMode = false;

  constructor(
    private modalCtrl: ModalController,
    private dataService: DataService,
    private toastCtrl: ToastController,
    private fb: FormBuilder
  ) {
    this.compradorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit() {
    if (this.comprador) {
      this.isEditMode = true;
      this.compradorForm.patchValue(this.comprador);
    }
  }

  dismiss = () => this.modalCtrl.dismiss();

  async submitForm() {
    if (this.compradorForm.invalid) return;

    try {
      if (this.isEditMode && this.comprador) {
        await this.dataService.updateComprador(this.comprador.id!, this.compradorForm.value);
      } else {
        await this.dataService.addComprador(this.compradorForm.value);
      }
      this.presentToast(`Comprador ${this.isEditMode ? 'actualizado' : 'añadido'} con éxito.`, 'success');
      this.dismiss();
    } catch (error) {
      this.presentToast('Error al guardar el comprador.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}