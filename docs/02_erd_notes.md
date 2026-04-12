# Diccionario Breve de Tablas y Campos Clave

## 1. Proveedores y Compras
*   **Proveedores:** Datos de las empresas abastecedoras. Campo clave: `nit_rut` (debe ser único para evitar duplicidades).
*   **Compras:** Encabezado de transacciones de abastecimiento.
*   **ComprasDetalle:** Renglones de la factura del proveedor especificando precio por insumo.

## 2. Inventario
*   **Insumos:** Catálogo maestro básico (ej: Arroz, Carne de res, Zanahoria). Campo clave: `stock_minimo` (dispara alertas CU11).
*   **Inventario:** Lotes reales del almacén. Campo clave: `fecha_vencimiento` (fundamental para CU10, Alertas de vencimiento).
*   **MovimientosInventario:** Log inmutable de suma o resta (ingreso por compras, salida a cocina, merma/vencido).

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
