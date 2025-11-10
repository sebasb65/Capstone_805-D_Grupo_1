// Importaciones de Angular Core y módulos de UI comunes
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de Ionic para componentes y controladores
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';

// RxJS Observable para reactividad de datos
import { Observable } from 'rxjs';

// Servicio de datos y modelo Cultivo
import { DataService, Cultivo } from '../../services/data.service';

// Componente modal reutilizable para crear/editar cultivos
import { CultivoModalComponent } from '../../components/cultivo-modal/cultivo-modal.component';

// Servicio de rutas de Angular para navegación
import { Router } from '@angular/router';

/**
 * Componente de página para gestionar cultivos agrícolas
 * Permite listar, crear, editar, archivar y ver detalles de cada cultivo
 */
@Component({
  selector: 'app-cultivos',
  templateUrl: './cultivos.page.html',
  styleUrls: ['./cultivos.page.scss'],
  standalone: true, // Componente standalone para Ionic/Angular
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CultivosPage {

  // Observable que emite la lista de cultivos registrados
  public cultivos$: Observable<Cultivo[]>;

  /**
   * Constructor con inyección de dependencias
   * @param dataService - Servicio de datos para CRUD de cultivos
   * @param modalCtrl - Controlador para abrir modales
   * @param alertCtrl - Controlador para mostrar alertas
   * @param toastCtrl - Controlador para mostrar mensajes toast
   * @param router - Servicio de navegacion Angular
   */
  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    // Inicializa el observable de cultivos, que se actualiza automáticamente
    this.cultivos$ = this.dataService.getCultivos();
  }

  /**
   * Abre el modal para crear o editar un cultivo
   * Si se pasa el cultivo, permite editar; si no, crear uno nuevo
   * @param cultivo - Cultivo seleccionado (opcional)
   */
  async openModal(cultivo?: Cultivo) {
    const modal = await this.modalCtrl.create({
      component: CultivoModalComponent,
      componentProps: { cultivo }
    });
    return await modal.present();
  }

  /**
   * Navega a la página de detalle del cultivo seleccionado
   * @param cultivo - Cultivo al que se quiere acceder en detalle
   */
  goToCultivoDetail(cultivo: Cultivo) {
    this.router.navigate(['/cultivo-detail', cultivo.id]);
  }

  /**
   * Muestra una alerta de confirmación antes de archivar un cultivo
   * Archivar solo oculta el cultivo de las listas, no lo elimina
   * @param cultivo - Cultivo a archivar
   */
  async confirmArchive(cultivo: Cultivo) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar el cultivo "${cultivo.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Archivar', 
          role: 'destructive', // Acción destructiva (color rojo)
          handler: () => this.archiveCultivo(cultivo.id!)
        }
      ]
    });
    await alert.present();
  }

  /**
   * Archiva el cultivo llamando al servicio correspondiente
   * Muestra mensaje de éxito/error según resultado
   * @param id - ID del cultivo a archivar
   */
  private async archiveCultivo(id: string) {
    try {
      await this.dataService.archiveCultivo(id);
      this.presentToast('Cultivo archivado.', 'success');
    } catch (error) {
      this.presentToast('Error al archivar el cultivo.', 'danger');
    }
  }

  /**
   * Muestra un mensaje tipo toast en pantalla para feedback
   * @param message - Texto del mensaje
   * @param color - Color del toast ('success' para verde, 'danger' para rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}
