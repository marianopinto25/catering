# Diccionario Breve de Tablas y Campos Clave

## 1. Proveedores y Compras
*   **Proveedores:** Datos de las empresas abastecedoras y de la persona responsable del contacto operativo.
    *   `nit_rut`: Debe ser único para evitar duplicidades.
    *   `responsable_nombre`: Persona responsable del proveedor.
    *   `responsable_cargo`: Cargo o rol de la persona responsable.
    *   `responsable_telefono`: Teléfono directo de la persona responsable.
    *   `responsable_email`: Correo de contacto de la persona responsable.
*   **Compras:** Encabezado de transacciones de abastecimiento. Una compra en estado `PENDIENTE_INGRESO` representa cantidad **en orden** para el resumen de inventario.
*   **ComprasDetalle:** Renglones de la factura del proveedor especificando precio por insumo.

## 2. Inventario
*   **Insumos:** Catálogo maestro básico (ej: Arroz, Carne de res, Zanahoria). 
    *   `categoria`: Permite organizar por tipo (Cárnicos, Lácteos, etc.).
    *   `unidad_medida`: Kg, L, Unidad, etc.
    *   `stock_minimo`: Umbral para disparar alertas de reabastecimiento (CU11).
    *   `estado`: `Activo` o `Inactivo` (borrado lógico).
*   **Inventario:** Representa los lotes físicos en almacén.
    *   `fecha_vencimiento`: Fecha límite de consumo (CU10).
    *   `estado`: Campo interno para control técnico. No se muestra como concepto principal al usuario final.
*   **MovimientosInventario:** Histórico detallado (Kardex) de cada entrada y salida. 
    *   Relacionado a un `Insumo` y opcionalmente a un registro de `Inventario` (lote).
    *   `tipo_movimiento`: Debe contemplar `Ingreso`, `Salida` y `Ajuste`.
    *   Los casos `Vencido`, `Dañado` y `Sobrante` se registran como motivos de un **ajuste de inventario**, no como un estado visible al usuario.
*   **SolicitudesInsumo:** Registro básico de pedidos internos del chef o cocina.
    *   `cantidad`: Cantidad solicitada.
    *   `estado`: `PENDIENTE`, `ATENDIDA` o `CANCELADA`.
    *   Las solicitudes en estado `PENDIENTE` alimentan la variable **Solicitado** del resumen de inventario.
*   **Resumen de Inventario:** Vista calculada por insumo, no necesariamente tabla física.
    *   `Existencia (onHand)`: Suma de lotes disponibles con cantidad actual mayor a cero.
    *   `En orden (onOrder)`: Suma de compras pendientes de ingreso.
    *   `Solicitado (requested)`: Suma de solicitudes internas pendientes del chef/cocina.

## 3. Menú y Cocina
*   **Menus:** Define el servicio planificado en una fecha específica (CU12, CU13).
*   **Platos:** Componentes del Menú.
*   **AjustesReceta:** Bitácora por si cocinero debe sustituir ingredientes (CU17).

## 4. Consumo y Asistencia (Comensales)
*   **EmpresaCliente:** La constructora u organización que paga el servicio de alimentación.
*   **TrabajadoresCliente:** El padrón de personal que comerá. Claves: `dni_codigo`, `codigo_qr` (CU19).
*   **Consumos:** Tabla de máxima concurrencia en la operación diaria. Clave: `doble_racion` (CU22) y el enlace `menu_id` y `trabajador_id` de forma que sea único por comida (para evitar consumos piratas, CU20).
*   **Feedback:** Satisfacción (estrellas/caritas). Vinculado unitariamente al consumo (CU23).

## 5. Staff Catering (Usuarios)
*   **Usuarios:** Control de acceso (JWT). Clave: `rol` (determina acceso a submódulos).
*   **AsistenciasStaff:** Reloj control interno (CU34, CU35).

## 6. Documentos Salida
*   **Facturas:** Generado post-aprobación del cliente. Clave: `estado`.
