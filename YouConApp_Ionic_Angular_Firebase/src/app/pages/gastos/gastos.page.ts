// Importaciones de Angular Core y módulos UI estándar
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de Ionic para UI y controladores de modal, alertas y toasts
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';

// RxJS Observable para manejo reactivo de datos
import { Observable } from 'rxjs';

// Servicio de datos y modelo Gasto
import { DataService, Gasto } from '../../services/data.service';

// Componente modal para crear o editar gastos
import { GastoModalComponent } from '../../components/gasto-modal/gasto-modal.component';

/**
 * Componente de página para gestionar gastos generales
 * Permite listar, crear, editar y eliminar gastos.
 */
@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.page.html',
  standalone: true, // Componente standalone (no requiere módulo extra)
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GastosPage {

  // Observable que emite la lista de gastos registrados
  public gastos$: Observable<Gasto[]>;

  /**
   * Constructor con inyección de dependencias
   * @param dataService - Servicio de datos para operaciones CRUD
   * @param modalCtrl - Controlador para abrir modales
   * @param alertCtrl - Controlador para mostrar alertas
   * @param toastCtrl - Controlador para mostrar mensajes toast
   */
  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    // Obtiene la lista de gastos desde el servicio y la mantiene actualizada reactivamente
    this.gastos$ = this.dataService.getGastos();
  }

  /**
   * Abre el modal para crear o editar un gasto
   * Si se pasa el gasto, edita; si no, crea uno nuevo
   * @param gasto - Gasto seleccionado (opcional)
   */
  async openModal(gasto?: Gasto) {
    const modal = await this.modalCtrl.create({
      component: GastoModalComponent,
      componentProps: { gasto } // Pasa el gasto actual si existe
    });
    return await modal.present();
  }

  /**
   * Muestra una alerta de confirmación antes de eliminar un gasto
   * Si se confirma, ejecuta el borrado
   * @param gasto - Gasto a eliminar
   */
  async confirmDelete(gasto: Gasto) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Estás seguro de que quieres eliminar este gasto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar
        { 
          text: 'Eliminar', 
          role: 'destructive', // Acción destructiva (color rojo)
          handler: () => this.deleteGasto(gasto.id!) // Elimina el gasto al confirmar
        }
      ]
    });
    await alert.present();
  }

  /**
   * Elimina un gasto llamando al servicio correspondiente
   * Muestra mensaje de éxito o error según resultado
   * @param id - ID del gasto a eliminar
   */
  private async deleteGasto(id: string) {
    try {
      await this.dataService.deleteGasto(id);
      this.presentToast('Gasto eliminado.', 'success');
    } catch (error) {
      this.presentToast('Error al eliminar el gasto.', 'danger');
    }
  }

  /**
   * Muestra un mensaje toast en pantalla
   * @param message - Texto del mensaje
   * @param color - Color del toast ('success' o 'danger')
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}


  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}
