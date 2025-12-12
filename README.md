# YouConApp: Sistema de Gestión Integral para Contratistas Agrícolas

> **Proyecto Capstone - Ingeniería en Informática**
> *Digitalizando la gestión del agro chileno.*

---

## Descripción del Proyecto

**YouConApp** es una solución móvil híbrida diseñada para digitalizar y formalizar la gestión operativa de los contratistas agrícolas.

El sector agrícola tradicionalmente sufre de informalidad administrativa ("el cuaderno de notas"), lo que conlleva a pérdida de información, errores en el cálculo de sueldos y falta de trazabilidad financiera. **YouConApp** resuelve esto centralizando trabajadores, tratos, cultivos y finanzas en una plataforma segura, escalable y accesible desde el terreno.

### Propuesta de Valor
* **Integridad Financiera:** Cálculo automático de haberes, descuentos y saldos acumulados.
* **Operación en Terreno:** Registro de tareas y asistencia desde el móvil.
* **Reportabilidad Profesional:** Generación de PDFs nativos compartibles vía WhatsApp/Correo.
* **Multi-Tenancy:** Soporte para Dueños y Supervisores con datos centralizados.

---

## Funcionalidades Clave

### 1. Gestión de Recursos Humanos
* CRUD completo de trabajadores.
* Historial de labores y cálculo de saldos en tiempo real.

### 2. Operaciones Agrícolas
* Registro de **Cultivos** y **Tareas** (Cosecha, Poda, Riego, etc.).
* Asociación lógica: `Trabajador -> Tarea -> Cultivo`.

### 3. Módulo Financiero (ACID)
* **Pagos y Cobros:** Registro transaccional de movimientos de dinero.
* **Integridad:** Uso de **Transacciones Atómicas** (`runTransaction`) de Firestore para asegurar que los saldos siempre cuadren con los movimientos.
* **Dashboard:** Visualización gráfica de Ingresos vs. Gastos (RxJS + Ngx-Charts).

### 4. Seguridad y Roles
* Autenticación vía **Firebase Auth**.
* **Guards** de protección de rutas en Angular.
* **Reglas de Seguridad (Firestore Rules)** en servidor para aislamiento de datos.

### 5. Reportabilidad Nativa
* Integración con **Capacitor Filesystem & Share API**.
* Generación de reportes PDF (`jsPDF`) guardados localmente y compartidos mediante el menú nativo de Android/iOS.

---

## Stack Tecnológico

La arquitectura del proyecto sigue el patrón de **Aplicación Híbrida Modular** con servicios desacoplados.

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | **Ionic 7** | Framework UI para experiencia nativa móvil. |
| **Lógica** | **Angular 17** | Arquitectura basada en *Standalone Components*. |
| **Backend (BaaS)** | **Firebase** | Auth para identidad y **Cloud Firestore** (NoSQL) para datos. |
| **Nativo** | **Capacitor** | Puente para acceso a Hardware (Archivos, Share). |
| **Lenguaje** | **TypeScript** | Tipado estricto para seguridad de código. |
| **Visualización** | **Ngx-Charts** | Gráficos reactivos SVG. |

---

## Arquitectura de Datos (Modelo NoSQL)

El sistema utiliza un modelo de documentos JSON en **Cloud Firestore**, optimizado para lectura en tiempo real.

* **Colección `usuarios`:** Perfiles y roles (Admin/Standard).
* **Colección `trabajadores`:** Datos personales y `saldo_acumulado`.
* **Colección `tareas`:** Registro transaccional (Log). Vincula `id_trabajador` y `id_cultivo`.
* **Colección `pagos`:** Registro de egresos.

> **Nota de Arquitectura:** Se implementó un patrón de **Multi-tenancy Lógico**. Todas las colecciones incluyen un campo `id_agricultor`. El servicio de datos (`DataService`) inyecta automáticamente el ID del dueño de la cuenta, permitiendo que los Supervisores operen sobre los datos del jefe de forma transparente.

---

## Instalación y Despliegue

### Requisitos Previos
* Node.js v18+
* Ionic CLI (`npm install -g @ionic/cli`)
* Cuenta de Firebase configurada.

### 1. Clonar el Repositorio
Comandos:
git clone [Link Repositorio]
cd Capstone_805-D_Grupo_1

## 2. Instalar Dependencias
Comandos: 
npm install

## 3. Configuración de Entorno
Crear el archivo src/environments/environment.ts con tus credenciales de Firebase:

Frangmento de ejemplo de codigo:
"TypeScript

export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  }
};"

## 4. Ejecutar en Web (Desarrollo)
Comandos:
ionic serve

## 5. Generar APK (Android)
Comandos:

# Compilar proyecto web
ionic build --prod

# Sincronizar con Android
npx cap sync

# Abrir Android Studio
npx cap open android
(Desde Android Studio: Build -> Build Bundle(s) / APK(s) -> Build APK)

---

### Equipo de Desarrollo
Este proyecto fue desarrollado bajo metodología SCRUM (5 Sprints) por:

Sebastián Boris - Lead Frontend Developer & QA
Responsable de: Integración UI, Lógica de Cliente, Capacitor, Calidad.

Giovanni Galleguillos - Backend Developer & PO Técnico
Responsable de: Arquitectura Firestore, Reglas de Seguridad, Lógica de Negocio.

Luis Rojas - Scrum Master & Documentation 
Responsable de: Gestión de Sprints, Métricas, Documentación Técnica.

---

Desarrollado para la asignatura Proyecto Capstone - Duoc UC 2025.
