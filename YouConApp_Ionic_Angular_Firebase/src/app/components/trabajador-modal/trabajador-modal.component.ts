import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular'; // <-- Asegúrate de importar LoadingController
import { DataService, Trabajador } from '../../services/data.service';

@Component({
  selector: 'app-trabajador-modal',
  templateUrl: './trabajador-modal.component.html',
  standalone: true, 
  imports: [IonicModule, CommonModule, ReactiveFormsModule] 
})
export class TrabajadorModalComponent implements OnInit {
  @Input() trabajador?: Trabajador;
  trabajadorForm: FormGroup;
  isEditMode = false;

  // Inyectamos LoadingController
  private loadingCtrl = inject(LoadingController); 
  private modalCtrl = inject(ModalController); 
  private dataService = inject(DataService); 
  private toastCtrl = inject(ToastController); 
  private fb = inject(FormBuilder);

  constructor() {
    this.trabajadorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit() {
    if (this.trabajador) {
      this.isEditMode = true;
      this.trabajadorForm.patchValue(this.trabajador);
    }
  }

  dismiss = () => this.modalCtrl.dismiss();

  async submitForm() {
    if (this.trabajadorForm.invalid) return;

    // ### INICIO DEL CAMBIO ###
    const loading = await this.loadingCtrl.create({
      message: 'Guardando...',
      spinner: 'crescent'
    });
    await loading.present();
    // ### FIN DEL CAMBIO ###

    try {
      if (this.isEditMode && this.trabajador) {
        await this.dataService.updateTrabajador(this.trabajador.id!, this.trabajadorForm.value);
      } else {
        await this.dataService.addTrabajador(this.trabajadorForm.value);
      }
      this.presentToast(`Trabajador ${this.isEditMode ? 'actualizado' : 'añadido'} con éxito.`, 'success');
      this.dismiss();
    } catch (error) {
      this.presentToast('Error al guardar el trabajador.', 'danger');
    } finally {
      // ### INICIO DEL CAMBIO ###
      // Nos aseguramos de que el loading se cierre siempre, incluso si hay un error
      loading.dismiss();
      // ### FIN DEL CAMBIO ###
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}