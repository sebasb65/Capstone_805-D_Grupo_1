import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { DataService, Cultivo } from '../../services/data.service';

@Component({
  selector: 'app-cultivo-modal',
  templateUrl: './cultivo-modal.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class CultivoModalComponent implements OnInit {
  @Input() cultivo?: Cultivo;
  cultivoForm: FormGroup;
  isEditMode = false;

  constructor(
    private modalCtrl: ModalController,
    private dataService: DataService,
    private toastCtrl: ToastController,
    private fb: FormBuilder
  ) {
    this.cultivoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      area: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit() {
    if (this.cultivo) {
      this.isEditMode = true;
      this.cultivoForm.patchValue(this.cultivo);
    }
  }

  dismiss = () => this.modalCtrl.dismiss();

  async submitForm() {
    if (this.cultivoForm.invalid) return;

    try {
      if (this.isEditMode && this.cultivo) {
        await this.dataService.updateCultivo(this.cultivo.id!, this.cultivoForm.value);
      } else {
        await this.dataService.addCultivo(this.cultivoForm.value);
      }
      this.presentToast(`Cultivo ${this.isEditMode ? 'actualizado' : 'añadido'} con éxito.`, 'success');
      this.dismiss();
    } catch (error) {
      this.presentToast('Error al guardar el cultivo.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}