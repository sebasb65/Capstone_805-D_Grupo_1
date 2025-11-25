import { Component, Input, OnInit, inject } from '@angular/core';
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
  
  maxDate: string = new Date().toISOString().split('T')[0];
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
      monto: ['', Validators.required], // String vacío para manejar formato
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit() {
    if (this.gasto) {
      this.isEditMode = true;
      // Al editar, formateamos el número existente para que se vea bonito (Ej: 5000 -> 5.000)
      const montoFormateado = new Intl.NumberFormat('es-CL').format(this.gasto.monto);
      
      this.gastoForm.patchValue({
        ...this.gasto,
        monto: montoFormateado
      });
    }
  }

  // --- FORMATEADOR VISUAL (1.000) ---
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
    if (this.gastoForm.invalid) return;

    try {
      const formValue = this.gastoForm.value;
      
      // --- LIMPIEZA: Quitar puntos antes de guardar ---
      const montoLimpio = parseInt(formValue.monto.toString().replace(/\./g, ''), 10);

      const gastoData = {
        categoria: formValue.categoria,
        descripcion: formValue.descripcion,
        monto: montoLimpio, // Guardamos int puro
        fecha: formValue.fecha,
      };

      if (this.isEditMode && this.gasto) {
        await this.dataService.updateGasto(this.gasto.id!, gastoData);
      } else {
        await this.dataService.addGasto(gastoData as any); 
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