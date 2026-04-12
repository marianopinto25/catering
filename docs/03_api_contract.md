# Contrato de API (Endpoints por Módulo)

Endpoints principales bajo prefijo `/api/v1/`

## 1. Proveedores y Compras
*   **GET `/proveedores`** - Lista de proveedores (paginación, filtros).
*   **POST `/proveedores`** - Crear proveedor.
*   **PUT `/proveedores/:id`** - Actualizar datos de proveedor.
*   **POST `/compras`** - Registra compra y genera ingresos a inventario automáticamente.
    *   *Req:* `{ proveedor_id: 1, fecha: "2024-04-12", items: [{ insumo_id: 5, cantidad: 10, precio_unitario: 15.0, fecha_vencimiento: "2024-12-01" }] }`

## 2. Inventario y Alertas
*   **GET `/insumos`** - Lista de insumos (Catálogo maestro).
*   **POST `/insumos`** - Crear nuevo insumo.
    *   *Req:* `{ nombre: "Harina", unidad_medida: "Kg", categoria: "Abarrotes", stock_minimo: 5 }`
*   **PUT `/insumos/:id`** - Editar maestro de insumo.
*   **GET `/inventario`** - Consulta de stock actual por lote/vencimiento.
*   **POST `/inventario/movimientos`** - Registrar entrada/salida/merma.
    *   *Req:* `{ insumo_id: 2, tipo: "Merma", cantidad: 5, motivo: "Vencido|Dañado", inventario_id: 10 }`
*   **GET `/alertas/vencimiento`** - Insumos con fecha <= 7 días (configurables).
*   **GET `/alertas/stock`** - Insumos con stock total < stock_minimo.

## 3. Menú y Cocina
*   **GET `/menus`** - Obtener planificación semanal (filtrado por fecha).
*   **POST `/menus`** - Planificar el menú de la semana.
*   **POST `/cocina/retiros`** - Solicitud de despacho de almacén a cocina.
*   **POST `/cocina/cambios`** - Registrar reporte de última hora sobre insumos.

## 4. Consumo (Comedor)
*   **POST `/consumos/qr`** - Escaneo y marcado instantáneo de comida.
    *   *Req:* `{ "codigo_qr": "hash-abcd", "menu_id": 99 }`
    *   *Res:* `{ "status": "ok", "trabajador": "Juan Perez", "doble": false }`
*   **POST `/consumos/feedback`** - Envio de encuesta de trabajador.
*   **POST `/sync`** - Subida masiva desde aplicación PWA offline (App en comedor sin red).

## 5. Reportes y Facturas
*   **GET `/reportes/diario`** - Agregación SQL sumando consumos del día en curso.
*   **GET `/reportes/export`** - Generación de descarga (recibe param `format=pdf|excel`).
*   **POST `/facturacion`** - Genera bloque de facturación consolidando reportes validados.

## 6. Auth y RRHH
*   **POST `/auth/login`** - Obtener accessToken JWT.
*   **POST `/staff/marcar`** - Marcaje de asistencia del cocinero o gerente (tipo in/out).
