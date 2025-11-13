// Importaciones de Angular Core y módulos estándar
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones de Ionic para UI y controladores modales, alertas y mensajes toast
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';

// RxJS Observable para manejo reactivo de datos
import { Observable } from 'rxjs';

// Servicio de datos y modelo Comprador
import { DataService, Comprador } from '../../services/data.service';

// Componente modal para crear o editar compradores
import { CompradorModalComponent } from '../../components/comprador-modal/comprador-modal.component';

// Componente modal para realizar cobros a compradores (registrar pagos)
import { CobroModalComponent } from 'src/app/components/cobro-modal/cobro-modal.component';

/**
 * Componente de página para gestionar compradores (clientes)
 * Permite listar, crear, editar, archivar y registrar pagos de compradores.
 */
@Component({
  selector: 'app-compradores',
  templateUrl: './compradores.page.html',
  standalone: true, // Componente standalone (no requiere módulo extra)
  imports: [IonicModule, CommonModule]
})
export class CompradoresPage {

  // Observable que emite la lista de compradores
  public compradores$: Observable<Comprador[]>;

  /**
   * Constructor con inyección de dependencias
   * @param dataService - Servicio de datos para operaciones CRUD
   * @param modalCtrl - Controlador para abrir modales
   * @param alertCtrl - Controlador para mostrar alertas/diálogos
   * @param toastCtrl - Controlador para mostrar mensajes toast
   */
  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    // Carga la lista de compradores desde el servicio de datos y la mantiene actualizada por reactividad
    this.compradores$ = this.dataService.getCompradores();
  }

  /**
   * Abre el modal para crear o editar un comprador
   * Si se pasa comprador, el modal se muestra en modo edición, si no, para crear uno nuevo
   * @param comprador - Comprador seleccionado (opcional)
   */
  async openModal(comprador?: Comprador) {
    const modal = await this.modalCtrl.create({
      component: CompradorModalComponent,
      componentProps: { comprador }
    });
    await modal.present();
  }

  /**
   * Muestra una alerta antes de archivar un comprador
   * Archivar lo oculta de las listas pero no lo elimina de base de datos
   * @param comprador - Comprador a archivar
   */
  async confirmArchive(comprador: Comprador) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Archivar',
      message: `¿Seguro que quieres archivar a ${comprador.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar la acción
        { 
          text: 'Archivar', 
          role: 'destructive', // Acción destructiva
          handler: () => this.archiveComprador(comprador.id!) // Ejecuta el archivado al confirmar
        }
      ]
    });
    await alert.present();
  }

  /**
   * Ejecuta el archivado del comprador llamando al servicio de datos
   * Muestra mensaje de éxito o error según resultado
   * @param id - ID del comprador a archivar
   */
  private async archiveComprador(id: string) {
    try {
      await this.dataService.archiveComprador(id);
      this.presentToast('Comprador archivado.', 'success');
    } catch (error) {
      this.presentToast('Error al archivar.', 'danger');
    }
  }

  /**
   * Muestra un mensaje toast
   * @param message - Texto del mensaje
   * @param color - Color de tipo ('success' = verde, 'danger' = rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }

  /**
   * Abre el modal para registrar un cobro/pago realizado por el comprador
   * @param comprador - Comprador a asociar el pago
   */
  async openCobroModal(comprador: Comprador) {
    const modal = await this.modalCtrl.create({
      component: CobroModalComponent,
      componentProps: { comprador }
    });
    await modal.present();
  }
}
