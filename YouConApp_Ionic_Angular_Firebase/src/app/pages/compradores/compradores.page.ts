import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Comprador } from '../../services/data.service';
import { CompradorModalComponent } from '../../components/comprador-modal/comprador-modal.component';
import { CobroModalComponent } from 'src/app/components/cobro-modal/cobro-modal.component';

@Component({
  selector: 'app-compradores',
  templateUrl: './compradores.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CompradoresPage {

  public compradores$: Observable<Comprador[]>;

  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.compradores$ = this.dataService.getCompradores();
  }

  async openModal(comprador?: Comprador) {
    const modal = await this.modalCtrl.create({
      component: CompradorModalComponent,
      componentProps: { comprador }
    });
    await modal.present();
  }

  async confirmArchive(comprador: Comprador) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar a ${comprador.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Archivar', role: 'destructive', handler: () => this.archiveComprador(comprador.id!) }
      ]
    });
    await alert.present();
  }

  private async archiveComprador(id: string) {
    try {
      await this.dataService.archiveComprador(id);
      this.presentToast('Comprador archivado.', 'success');
    } catch (error) {
      this.presentToast('Error al archivar.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }

  async openCobroModal(comprador: Comprador) {
    const modal = await this.modalCtrl.create({
      component: CobroModalComponent,
      componentProps: { comprador }
    });
    await modal.present();
  }
}
