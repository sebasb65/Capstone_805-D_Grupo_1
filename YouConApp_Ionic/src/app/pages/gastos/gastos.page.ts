import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Gasto } from '../../services/data.service';
import { GastoModalComponent } from '../../components/gasto-modal/gasto-modal.component';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GastosPage {

  public gastos$: Observable<Gasto[]>;

  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.gastos$ = this.dataService.getGastos();
  }

  async openModal(gasto?: Gasto) {
    const modal = await this.modalCtrl.create({
      component: GastoModalComponent,
      componentProps: { gasto }
    });
    return await modal.present();
  }

  async confirmDelete(gasto: Gasto) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Estás seguro de que quieres eliminar este gasto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteGasto(gasto.id!) }
      ]
    });
    await alert.present();
  }

  private async deleteGasto(id: string) {
    try {
      await this.dataService.deleteGasto(id);
      this.presentToast('Gasto eliminado.', 'success');
    } catch (error) {
      this.presentToast('Error al eliminar el gasto.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}