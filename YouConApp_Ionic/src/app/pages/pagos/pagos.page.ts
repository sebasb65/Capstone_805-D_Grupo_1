import { Component, OnInit, inject } from '@angular/core';  
// CommonModule incluye directivas ngIf, ngFor; DatePipe formatea fechas
import { CommonModule, DatePipe } from '@angular/common';  
// ReactiveFormsModule para formularios reactivos, FormBuilder y validadores
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';  
// Componentes Ionic para UI y feedback: toast, loading, alert
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';  
// Observable para streams de datos
import { Observable } from 'rxjs';  
// startWith para inicializar el historial de pagos con un array vacío
import { startWith } from 'rxjs/operators';  
import { DataService, Trabajador, Pago } from '../../services/data.service';  
import { AuthService } from '../../services/auth.service';  

@Component({
  selector: 'app-pagos',                  // Tag HTML: <app-pagos>
  templateUrl: './pagos.page.html',       // Plantilla asociada
  standalone: true,                       // Componente independiente
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  providers: [DatePipe]                   // Proveedor para formatear fechas en el constructor
})
export class PagosPage implements OnInit {
  pagoForm: FormGroup;                    // FormGroup para capturar campos del pago
  trabajadores$: Observable<Trabajador[]>;// Lista de trabajadores cargada desde DataService
  historialPagos$: Observable<Pago[]>;    // Historial de pagos con inicio en array vacío
  private userId: string | null = null;  // ID del agricultor autenticado

  // Inyección de dependencias con la API inject()
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private datePipe = inject(DatePipe);

  constructor() {
    // Cargar trabajadores y pagos desde el servicio
    this.trabajadores$ = this.dataService.getTrabajadores();
    this.historialPagos$ = this.dataService.getPagos().pipe(
      startWith([]) // Emitir inmediatamente array vacío si no hay pagos aún
    );

    // Suscribirse al usuario autenticado para capturar su ID
    this.authService.user$.subscribe(user => {
      this.userId = user ? user.uid : null;
    });

    // Configurar formulario reactivo con validaciones
    this.pagoForm = this.fb.group({
      trabajador: [null, Validators.required],   // Debe seleccionar un trabajador
      monto: [null, [Validators.required, Validators.min(1)]], // Monto mínimo 1
      fecha: [
        this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
        Validators.required                         // Fecha por defecto hoy
      ]
    });
  }

  ngOnInit() {
    // No hay lógica adicional en inicialización
  }

  // Método para registrar un nuevo pago
  async registrarPago() {
    if (this.pagoForm.invalid || !this.userId) return;

    // Mostrar indicador de carga mientras se guarda el pago
    const loading = await this.loadingCtrl.create({ message: 'Registrando pago...' });
    await loading.present();

    const { trabajador, monto, fecha } = this.pagoForm.value;
    const trabajadorSeleccionado: Trabajador = trabajador;

    // Crear objeto Pago sin campo 'id'
    const nuevoPago: Omit<Pago, 'id'> = {
      id_trabajador: trabajadorSeleccionado.id!,
      nombre_trabajador: `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`,
      monto,
      fecha,
      id_agricultor: this.userId!
    };

    try {
      // Llamar servicio que registra el pago y actualiza balance
      await this.dataService.addPaymentAndUpdateBalance(nuevoPago);
      await loading.dismiss();
      this.presentToast('Pago registrado con éxito.', 'success');
      // Resetear monto y conservar la fecha actualizada
      this.pagoForm.reset({ fecha: this.datePipe.transform(new Date(), 'yyyy-MM-dd') });
    } catch {
      await loading.dismiss();
      this.presentToast('Error al registrar el pago.', 'danger');
    }
  }

  // Mostrar diálogo de confirmación antes de eliminar un pago
  async confirmDelete(pago: Pago) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: '¿Seguro que quieres eliminar este pago? El monto se devolverá al saldo del trabajador.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deletePago(pago) // Llamar método privado de eliminación
        }
      ]
    });
    await alert.present();
  }

  // Eliminar pago y restaurar el saldo del trabajador
  private async deletePago(pago: Pago) {
    try {
      await this.dataService.deletePagoWithBalanceUpdate(pago);
      this.presentToast('Pago eliminado con éxito.', 'success');
    } catch {
      this.presentToast('Error al eliminar el pago.', 'danger');
    }
  }

  // Método genérico para mostrar mensajes toast
  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
