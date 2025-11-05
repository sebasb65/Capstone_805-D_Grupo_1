# Esquema de Base de Datos — YouConApp (Firestore) **REAL**
**Snapshot:** 2025-11-05  
**Fuente:** Analizado desde `src/` (servicios, páginas y componentes).  
**Convención:** Todas las colecciones filtran por `id_agricultor` y muchas usan `estado: 'activo' | 'inactivo'`.

---

## 1) Colecciones y campos

### A) `trabajadores`
Campos visibles en código:
- `id` *(doc id)*
- `nombre`: string
- `apellido`: string
- `saldo_acumulado`: number  *(se actualiza con pagos y/o tareas)*
- `id_agricultor`: string *(uid del usuario)*
- `estado`: 'activo' | 'inactivo'

**Consultas detectadas:** `where('id_agricultor','==',uid)`, `where('estado','==','activo')`  
**Índices sugeridos:** `(id_agricultor ASC, estado ASC)`

---

### B) `compradores`
- `id` *(doc id)*
- `nombre`: string
- `saldo_deudor`: number
- `id_agricultor`: string
- `estado`: 'activo' | 'inactivo'

**Consultas:** `where('id_agricultor','==',uid)`, `where('estado','==','activo')`

---

### C) `cultivos`
- `id` *(doc id)*
- `nombre`: string
- `descripcion`?: string
- `superficie`?: number
- `id_agricultor`: string
- `estado`: 'activo' | 'inactivo'

**Consultas:** `where('id_agricultor','==',uid)`, `where('estado','==','activo')`

---

### D) `gastos`
- `id` *(doc id)*
- `categoria`: string  *(p.ej., 'Mano_obra', 'Insumos', 'Combustible', 'Otros')*
- `descripcion`: string
- `monto`: number
- `fecha`: string *(ISO o dd-mm-aaaa según formulario)*
- `id_agricultor`: string

**Consultas:** `where('id_agricultor','==',uid)` (ordenados/filtrados por `fecha`)  
**Índices sugeridos:** `(id_agricultor ASC, fecha DESC)`

---

### E) `ventas`
- `id` *(doc id)*
- `id_comprador`: string
- `nombre_comprador`: string
- `fecha`: string
- `items`: Array\<{ `producto`: string, `cantidad`: number, `unidad`: string, `precioUnitario`: number }\>
- `total_venta`: number
- `id_agricultor`: string

**Consultas:** `where('id_agricultor','==',uid)`  
**Actualizaciones relacionadas:** afectan `saldo_deudor` del **comprador** mediante **cobros** (no directo en venta).

---

### F) `tareas`
- `id` *(doc id)*
- `id_trabajador`: string
- `nombre_trabajador`: string
- `nombre_tarea`: string
- `fecha`: string
- `horas`: number
- `costo_hh`: number
- `id_agricultor`: string
- `id_cultivo`?: string
- `nombre_cultivo`?: string

**Consultas con filtros:** por `id_trabajador`, `id_cultivo`, rango `fecha_inicio`–`fecha_fin`.  
**Efectos secundarios:** actualiza `saldo_acumulado` del **trabajador** al crear/borrar.

---

### G) `pagos`
- `id` *(doc id)*
- `id_trabajador`: string
- `nombre_trabajador`: string
- `monto`: number
- `fecha`: string
- `id_agricultor`: string

**Transacciones detectadas:** creación y eliminación ajustan `saldo_acumulado` del **trabajador**.

---

### H) `cobros`
- `id` *(doc id)*
- `id_comprador`: string
- `nombre_comprador`: string
- `monto`: number
- `fecha`: string
- `id_agricultor`: string

**Transacciones detectadas:** creación ajusta `saldo_deudor` del **comprador**.

---

## 2) Relaciones clave
- **trabajadores (1) — (N) pagos** *(ajusta `saldo_acumulado`)*
- **trabajadores (1) — (N) tareas** *(acumula HH y costo → saldo)*
- **compradores (1) — (N) cobros** *(ajusta `saldo_deudor`)*
- **cultivos (1) — (N) tareas** *(vínculo opcional `id_cultivo`)*
- **ventas** contienen `items[]` *(detalle por producto/valor)*
- Todas las colecciones ancladas a **id_agricultor** (aislamiento multiusuario).

---

## 3) Índices compuestos recomendados
- `gastos`: `(id_agricultor ASC, fecha DESC)`
- `ventas`: `(id_agricultor ASC, fecha DESC)`
- `tareas`: `(id_agricultor ASC, fecha DESC)`, y simples por `id_trabajador`, `id_cultivo`
- `trabajadores`: `(id_agricultor ASC, estado ASC)`
- `compradores`: `(id_agricultor ASC, estado ASC)`
- `cultivos`: `(id_agricultor ASC, estado ASC)`

---

## 4) Reglas Firestore (resumen)
- **Lectura/Escritura** permitida solo si `request.auth.uid == resource.data.id_agricultor` (o en `create`, `request.resource.data.id_agricultor`).
- Los campos de estado deben ser validados (`activo`/`inactivo`).
- Validaciones de rangos: `monto > 0`, `horas >= 0`, etc.

Consulta `rules/firestore.rules` para detalle.
