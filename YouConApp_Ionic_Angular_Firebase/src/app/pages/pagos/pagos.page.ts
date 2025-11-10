// Importaciones necesarias de Angular Core y CommonModule
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

// Importaciones para formularios reactivos de Angular
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Importaciones de Ionic para UI y controladores
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';

// RxJS Observable para manejo reactivo de datos
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators'; // <-- Corrección de import para pipe

// Servicio de datos y modelos
import { DataService, Trabajador, Pago } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

/**
 * Componente de página para gestionar pagos a trabajadores
 * Permite registrar pagos, listar historial de pagos y eliminar pagos (con reversión de saldo)
 */
@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  standalone: true, // Componente standalone
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  providers: [DatePipe] // DatePipe proporcionado localmente
})
export class PagosPage implements OnInit {
  
  // Formulario reactivo principal para registrar pago
  pagoForm: FormGroup;
  
  // Observable que emite la lista de trabajadores para elegir destinatario del pago
  trabajadores$: Observable<Trabajador[]>;
  
  // Observable que emite el historial de todos los pagos registrados
  historialPagos$: Observable<Pago[]>;
  
  // ID del usuario autenticado/agricultor
  private userId: string | null = null;

  // Inyección de dependencias usando el patrón inject()
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private datePipe = inject(DatePipe); // DatePipe para formatear fecha

  /**
   * Constructor del componente
   * Inicializa observables y configura el formulario reactivo
   * Suscribe al usuario autenticado para obtener su ID
   */
  constructor() {
    // Carga la lista de trabajadores reactivamente desde el servicio de datos
    this.trabajadores$ = this.dataService.getTrabajadores();

    // Carga el historial de pagos desde el servicio de datos, inicia con array vacío por seguridad
    this.historialPagos$ = this.dataService.getPagos().pipe(startWith([]));

    // Suscripción para obtener el ID de usuario/agricultor autenticado
    this.authService.user$.subscribe(user => this.userId = user ? user.uid : null);

    // Inicialización del formulario reactivo y validaciones
    this.pagoForm = this.fb.group({
      trabajador: [null, Validators.required], // Trabajador destinatario (obligatorio)
      monto: [null, [Validators.required, Validators.min(1)]], // Monto a pagar (mínimo 1)
      fecha: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required], // Fecha default (hoy)
    });
  }

  /**
   * Hook de inicialización (no requiere lógica extra)
   */
  ngOnInit() { }

  /**
   * Registrar pago a trabajador y actualizar el balance
   * Realiza validación, muestra loading, y da feedback por toast según éxito/error
   */
  async registrarPago() {
    // Validación previa
    if (this.pagoForm.invalid || !this.userId) return;

    // Muestra indicador de carga hasta terminar proceso
    const loading = await this.loadingCtrl.create({ message: 'Registrando pago...' });
    await loading.present();

    // Obtiene valores del formulario y datos del trabajador elegido
    const formValue = this.pagoForm.value;
    const trabajadorSeleccionado: Trabajador = formValue.trabajador;

    // Construcción del objeto de pago (sin ID, que será generado automáticamente)
    const nuevoPago: Omit<Pago, 'id'> = {
      id_trabajador: trabajadorSeleccionado.id!,
      nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
      monto: formValue.monto,
      fecha: formValue.fecha,
      id_agricultor: this.userId
    };

    try {
      // Guarda el pago y actualiza el balance del trabajador
      await this.dataService.addPaymentAndUpdateBalance(nuevoPago);

      // Finaliza loading e informa éxito
      await loading.dismiss();
      this.presentToast('Pago registrado con éxito.', 'success');

      // Resetea el formulario y deja la fecha actual por defecto
      this.pagoForm.reset({ fecha: this.datePipe.transform(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      // Finaliza loading e informa error
      await loading.dismiss();
      this.presentToast('Error al registrar el pago.', 'danger');
    }
  }

  /**
   * Muestra alerta de confirmación antes de eliminar un pago
   * La reversión retorna el monto eliminado al saldo del trabajador
   * @param pago - Pago a eliminar
   */
  async confirmDelete(pago: Pago) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Seguro que quieres eliminar este pago? El monto se devolverá al saldo del trabajador.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' }, // Botón para cancelar
        { 
          text: 'Eliminar', 
          role: 'destructive', // Acción destructiva (color rojo)
          handler: () => this.deletePago(pago) // Ejecuta eliminación seguida de reversión de saldo
        }
      ]
    });
    await alert.present();
  }

  /**
   * Elimina el pago y revierte el balance del trabajador
   * Método privado llamado desde confirmación
   * @param pago - Pago a eliminar
   */
  private async deletePago(pago: Pago) {
    try {
      await this.dataService.deletePagoWithBalanceUpdate(pago);
      this.presentToast('Pago eliminado con éxito.', 'success');
    } catch (error) {
      this.presentToast('Error al eliminar el pago.', 'danger');
    }
  }

  /**
   * Muestra un mensaje toast en pantalla
   * @param message - Texto del mensaje
   * @param color - Color del toast ('success' = verde, 'danger' = rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
