// Importaciones necesarias de Angular Core
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importaciones para formularios reactivos de Angular
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

// Importaciones de componentes y controladores de Ionic
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';

// Observable de RxJS para manejo de datos asíncronos
import { Observable } from 'rxjs';

// Servicio de datos y sus interfaces (modelos)
import { DataService, Comprador, Venta } from '../../services/data.service';

// Servicio de autenticación para obtener el usuario actual
import { AuthService } from '../../services/auth.service';

// Router para navegación entre páginas
import { Router } from '@angular/router';

/**
 * Componente de página para registrar ventas/ingresos
 * Permite registrar ventas de productos agrícolas a compradores
 * Soporta múltiples items por venta (diferentes calidades/cantidades/precios)
 * Calcula automáticamente el total de la venta y actualiza el balance del comprador
 */
@Component({
  selector: 'app-ingresos',
  templateUrl: './ingresos.page.html',
  standalone: true, // Componente standalone
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class IngresosPage implements OnInit {
  
  // Formulario reactivo principal para gestionar los datos de la venta
  ventaForm: FormGroup;
  
  // Observable que contiene la lista de compradores disponibles
  compradores$: Observable<Comprador[]>;
  
  // ID del usuario autenticado (agricultor)
  private userId: string | null = null;

  // Inyección de dependencias usando el patrón inject()
  private fb = inject(FormBuilder); // Constructor de formularios reactivos
  private dataService = inject(DataService); // Servicio para operaciones CRUD
  private authService = inject(AuthService); // Servicio de autenticación
  private toastCtrl = inject(ToastController); // Controlador de mensajes toast
  private loadingCtrl = inject(LoadingController); // Controlador de indicadores de carga
  private router = inject(Router); // Servicio de navegación

  /**
   * Constructor del componente
   * Inicializa el observable de compradores y el formulario reactivo
   * Suscribe al usuario autenticado para obtener su ID
   */
  constructor() {
    // Obtiene la lista de compradores desde Firestore
    this.compradores$ = this.dataService.getCompradores();
    
    // Suscripción al estado de autenticación para obtener el userId
    this.authService.user$.subscribe(user => this.userId = user ? user.uid : null);

    // Inicialización del formulario reactivo con sus campos y validaciones
    this.ventaForm = this.fb.group({
      comprador: [null, Validators.required], // Comprador seleccionado (obligatorio)
      // Fecha actual por defecto, formateada como YYYY-MM-DD (obligatorio)
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      // Array dinámico de items (productos vendidos) - debe tener al menos 1 item
      items: this.fb.array([], Validators.required)
    });
  }

  /**
   * Hook de inicialización del componente
   * Se ejecuta después de que Angular inicializa el componente
   * Añade un item vacío inicial para que el usuario pueda empezar a llenar datos
   */
  ngOnInit() { 
    // Añade el primer item al FormArray al cargar la página
    this.addItem(); 
  }

  /**
   * Getter para acceder al FormArray de items
   * Facilita el acceso desde el template y otros métodos
   * @returns FormArray con los items de la venta
   */
  get items(): FormArray { 
    return this.ventaForm.get('items') as FormArray; 
  }

  /**
   * Añade un nuevo grupo de controles para un item de venta
   * Cada item representa un producto con calidad, cantidad y precio
   * Permite registrar múltiples productos/calidades en una misma venta
   */
  addItem() {
    // Crea un nuevo FormGroup con los campos del item
    const itemGroup = this.fb.group({
      calidad: ['', Validators.required], // Calidad del producto (ej: "Primera", "Segunda")
      cantidad: [null, [Validators.required, Validators.min(1)]], // Cantidad vendida (obligatorio, >= 1)
      precio_unitario: [null, [Validators.required, Validators.min(1)]] // Precio por unidad (obligatorio, >= 1)
    });
    
    // Añade el grupo al FormArray
    this.items.push(itemGroup);
  }

  /**
   * Elimina un item específico del FormArray
   * @param index - Índice del item a eliminar
   */
  removeItem(index: number) { 
    this.items.removeAt(index); 
  }

  /**
   * Registra la venta en Firestore y actualiza el balance del comprador
   * Calcula automáticamente el total de la venta sumando (cantidad × precio_unitario) de cada item
   * Actualiza el balance_pendiente del comprador sumando el total de la venta
   */
  async registrarVenta() {
    // Valida que el formulario sea válido y que exista un usuario autenticado
    if (this.ventaForm.invalid || !this.userId) return;

    // Muestra indicador de carga mientras se guarda
    const loading = await this.loadingCtrl.create({ message: 'Registrando venta...' });
    await loading.present();

    // Obtiene los valores del formulario
    const formValue = this.ventaForm.value;
    
    // Extrae el comprador seleccionado (objeto completo)
    const compradorSeleccionado: Comprador = formValue.comprador;
    
    // Calcula el total de la venta sumando (cantidad × precio_unitario) de cada item
    // reduce itera sobre todos los items y acumula el total, comenzando desde 0
    const totalVenta = formValue.items.reduce(
      (total: number, item: any) => total + (item.cantidad * item.precio_unitario), 
      0
    );

    // Construye el objeto Venta con todos los datos necesarios
    // Omit<Venta, 'id'> indica que no incluye el campo 'id' (lo genera Firestore)
    const nuevaVenta: Omit<Venta, 'id'> = {
      id_comprador: compradorSeleccionado.id!, // ID del comprador
      nombre_comprador: compradorSeleccionado.nombre, // Nombre del comprador
      fecha: formValue.fecha, // Fecha de la venta
      items: formValue.items, // Array de items vendidos
      total_venta: totalVenta, // Total calculado de la venta
      id_agricultor: this.userId // ID del agricultor (usuario actual)
    };

    try {
      // Guarda la venta y actualiza el balance del comprador automáticamente
      // addVentaAndUpdateBalance suma total_venta al balance_pendiente del comprador
      await this.dataService.addVentaAndUpdateBalance(nuevaVenta);
      
      // Cierra el indicador de carga
      await loading.dismiss();
      
      // Muestra mensaje de éxito
      this.presentToast('Venta registrada con éxito.', 'success');
      
      // Navega de vuelta a la página principal
      this.router.navigate(['/home']);
    } catch (e) {
      // En caso de error, cierra el loading
      await loading.dismiss();
      
      // Muestra mensaje de error
      this.presentToast('Error al registrar la venta.', 'danger');
    }
  }

  /**
   * Muestra un mensaje toast en la pantalla
   * @param message - Texto del mensaje a mostrar
   * @param color - Color del toast ('success' para verde, 'danger' para rojo)
   */
  async presentToast(message: string, color: 'success' | 'danger') {
    // Crea el toast con duración de 2 segundos en la parte superior
    const toast = await this.toastCtrl.create({ 
      message, 
      duration: 2000, 
      color, 
      position: 'top' 
    });
    // Muestra el toast
    toast.present();
  }
}

