# Contrato de API (Endpoints por Módulo)

Endpoints principales bajo prefijo `/api/v1/`

## 1. Proveedores y Compras
*   **GET `/proveedores`** - Lista de proveedores (paginación, filtros).
*   **POST `/proveedores`** - Crear proveedor.
    *   *Req:* `{ "nit_rut": "1234", "razon_social": "ABC", "telefono": "..." }`
    *   *Res:* `201 Created`
*   **PUT `/proveedores/:id`** - Actualizar datos de proveedor.
*   **POST `/compras`** - Crea factura de compra y, en éxito, gatilla movimientos de entrada al inventario.
    *   *Req:* `{ proveedor_id: 1, monto: 150.0, insumos: [{ id:5, cant:10, precio:15 }] }`

## 2. Inventario
*   **GET `/inventario`** - Estado de existencias y lotes.
*   **POST `/inventario/ingreso`** - Añadir lote manualmente (sin compras).
*   **POST `/inventario/mermas`** - Retirar inventario por avería o fecha.
    *   *Req:* `{ insumo_id: 2, cantidad: 5, motivo: "vencido" }`
*   **GET `/inventario/alertas`** - Endpoint combinando alertas de stock mínimo o vencimiento cercano.

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
