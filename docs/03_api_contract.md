# Contrato de API (Endpoints por Módulo)

Endpoints principales bajo prefijo actual `/api/`.

## 1. Proveedores y Compras
*   **GET `/proveedores`** - Lista de proveedores (paginación, filtros).
*   **POST `/proveedores`** - Crear proveedor.
    *   *Req Sprint 3:* `{ nit_rut, razon_social, telefono, responsable_nombre, responsable_cargo, responsable_telefono, responsable_email }`
*   **PUT `/proveedores/:id`** - Actualizar datos de proveedor.
    *   *Req Sprint 3:* mismos campos de creación. Los campos de responsable son obligatorios para cumplir contacto real del proveedor.
*   **POST `/compras`** - Registra compra y genera ingresos a inventario automáticamente.
    *   *Req:* `{ proveedor_id: 1, fecha: "2024-04-12", items: [{ insumo_id: 5, cantidad: 10, precio_unitario: 15.0, fecha_vencimiento: "2024-12-01" }] }`

## 2. Inventario y Alertas
*   **GET `/insumos`** - Lista de insumos (Catálogo maestro).
*   **POST `/insumos`** - Crear nuevo insumo.
    *   *Req:* `{ nombre: "Harina", unidad_medida: "Kg", categoria: "Abarrotes", stock_minimo: 5 }`
*   **PUT `/insumos/:id`** - Editar maestro de insumo.
*   **GET `/inventario`** - Consulta de stock actual por lote/vencimiento.
*   **GET `/inventario/resumen`** - Resumen operativo por insumo con lenguaje de inventario real.
    *   *Res:* `[{ insumo_id, nombre, unidad_medida, categoria, onHand, onOrder, requested, stock_minimo }]`
    *   `onHand`: Existencia física disponible.
    *   `onOrder`: Cantidad comprada/ordenada y pendiente de recibir.
    *   `requested`: Cantidad solicitada por chef/cocina y pendiente de atender.
*   **POST `/inventario/movimientos`** - Registrar entrada/salida/merma.
    *   *Req Sprint 3:* `{ insumo_id: 2, tipo: "Ajuste", cantidad: 5, motivo: "Vencido|Dañado|Sobrante", inventario_id: 10 }`
    *   Nota: vencido, dañado y sobrante se tratan como ajustes de inventario, no como estados visibles.
*   **GET `/alertas?dias=7`** - Alertas para anticipar uso de cocina: bajo stock y lotes próximos a vencer.
    *   Wording UI esperado: indicar qué puede afectar la preparación y con cuánta anticipación actuar.

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
