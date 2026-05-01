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
*   **GET `/compras/sugerencia?anio=2026&mes=4&semana=1`** - Calcula lista sugerida de compra basada en menú semanal, existencia y compras en orden.
    *   *Req query Sprint 5:* `anio`, `mes`, `semana`.
    *   *Res Sprint 5:*
        ```json
        {
          "anio": 2026,
          "mes": 4,
          "semana": 1,
          "items": [
            {
              "insumo_id": 1,
              "nombre": "Arroz",
              "unidad": "Kg",
              "requerido": 14.4,
              "existencia": 4,
              "enOrden": 3,
              "sugerido": 7.4,
              "vida_util_dias": 7,
              "limite_perecible": 14.4
            }
          ]
        }
        ```
    *   Fórmula: `sugerido = min(max(0, requerido - (existencia + enOrden)), limite_perecible)`.
    *   Las unidades se determinan desde la receta del plato (`PlatoInsumo.unidad_medida`).

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
*   **GET `/menus?anio=2026&mes=4`** - Obtener menú mensual con Semana 1-4, días, turno y plato asignado.
*   **POST `/menus`** - Crear cabecera de menú mensual.
    *   *Req Sprint 4:* `{ anio: 2026, mes: 4, estado: "BORRADOR" }`
*   **PUT `/menus/:id`** - Actualizar cabecera del menú mensual.
*   **POST `/menus/:id/items`** - Agregar plato al menú mensual.
    *   *Req Sprint 4:* `{ semana: 1, dia: "Lunes", turno: "Desayuno|Almuerzo|Cena", plato_id: 3, porciones_estimadas: 120 }`
*   **PUT `/menus/:id/items/:itemId`** - Editar plato/día/porciones del menú.
*   **DELETE `/menus/:id/items/:itemId`** - Quitar un plato del menú.
*   **GET `/platos`** - Listar catálogo de platos activos.
*   **POST `/platos`** - Crear plato.
    *   *Req Sprint 4:* `{ nombre, descripcion }`
*   **PUT `/platos/:id`** - Editar plato.
*   **DELETE `/platos/:id`** - Borrado lógico de plato.
*   **GET `/platos/:id/receta`** - Obtener receta mínima de un plato.
*   **POST `/platos/:id/receta`** - Agregar insumo a receta.
    *   *Req Sprint 4:* `{ insumo_id, cantidad_por_porcion, unidad_medida }`
*   **PUT `/platos/:id/receta/:recetaId`** - Editar cantidad por porción de un insumo.
*   **DELETE `/platos/:id/receta/:recetaId`** - Quitar insumo de receta.
*   **GET `/menus/:id/requerimiento-semanal?semana=1`** - Calcular requerimiento consolidado de insumos para una semana.
    *   *Res Sprint 4:* `[{ insumo_id, nombre, unidad_medida, cantidad_requerida, porciones_totales }]`
    *   Cálculo: sumatoria de `cantidad_por_porcion * porciones_estimadas` de cada plato programado en la semana, incluyendo desayuno, almuerzo y cena.
*   **Carga desde Excel/CSV en UI** - La interfaz permite importar un CSV exportado desde Excel.
    *   Columnas obligatorias: `semana,dia,turno,plato,porciones`.
    *   Si el plato no existe, se crea automáticamente sin receta para completarla después.
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
