import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Cultivo } from '../../services/data.service';
import { CultivoModalComponent } from '../../components/cultivo-modal/cultivo-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cultivos',
  templateUrl: './cultivos.page.html',
  styleUrls: ['./cultivos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CultivosPage {

  public cultivos$: Observable<Cultivo[]>;

  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.cultivos$ = this.dataService.getCultivos();
  }

  async openModal(cultivo?: Cultivo) {
    const modal = await this.modalCtrl.create({
      component: CultivoModalComponent,
      componentProps: { cultivo }
    });
    return await modal.present();
  }

  goToCultivoDetail(cultivo: Cultivo) {
    this.router.navigate(['/cultivo-detail', cultivo.id]);
  }

  async confirmArchive(cultivo: Cultivo) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar el cultivo "${cultivo.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Archivar', role: 'destructive', handler: () => this.archiveCultivo(cultivo.id!) }
      ]
    });
    await alert.present();
  }

  private async archiveCultivo(id: string) {
    try {
      await this.dataService.archiveCultivo(id);
      this.presentToast('Cultivo archivado.', 'success');
    } catch (error) {
      this.presentToast('Error al archivar el cultivo.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}