import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { DataService, Cultivo } from '../../services/data.service';
import { CultivoModalComponent } from '../../components/cultivo-modal/cultivo-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cultivos',                     // Selector HTML para este componente
  templateUrl: './cultivos.page.html',          // Plantilla asociada
  styleUrls: ['./cultivos.page.scss'],          // Estilos específicos del componente
  standalone: true,                             // Componente independiente
  imports: [IonicModule, CommonModule, FormsModule] // Módulos necesarios para la vista
})
export class CultivosPage {

  public cultivos$: Observable<Cultivo[]>;      // Observable con la lista de cultivos

  constructor(
    private dataService: DataService,           // Servicio para acceder a datos de cultivos
    private modalCtrl: ModalController,         // Controlador para abrir modales
    private alertCtrl: AlertController,         // Controlador para mostrar alertas
    private toastCtrl: ToastController,         // Controlador para mostrar toasts
    private router: Router                      // Router para navegación entre páginas
  ) {
    // Obtener cultivos desde el servicio al inicializar
    this.cultivos$ = this.dataService.getCultivos();
  }

  // Abre el modal para crear o editar un cultivo
  async openModal(cultivo?: Cultivo) {
    const modal = await this.modalCtrl.create({
      component: CultivoModalComponent,
      componentProps: { cultivo }               // Si se pasa un cultivo, se edita; si no, se crea
    });
    return await modal.present();
  }

  // Navega a la página de detalle del cultivo seleccionado
  goToCultivoDetail(cultivo: Cultivo) {
    this.router.navigate(['/cultivo-detail', cultivo.id]);
  }

  // Muestra una alerta para confirmar el archivado del cultivo
  async confirmArchive(cultivo: Cultivo) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar el cultivo "${cultivo.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Archivar',
          role: 'destructive',
          handler: () => this.archiveCultivo(cultivo.id!)
        }
      ]
    });
    await alert.present();
  }

  // Ejecuta el archivado del cultivo y muestra un toast de resultado
  private async archiveCultivo(id: string) {
    try {
      await this.dataService.archiveCultivo(id);
      this.presentToast('Cultivo archivado.', 'success');
    } catch (error) {
      this.presentToast('Error al archivar el cultivo.', 'danger');
    }
  }

  // Muestra un toast con mensaje y color según el resultado
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
