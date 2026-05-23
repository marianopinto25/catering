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
*   **GET `/compras/sugerencia?mes=4&semana=1`** - Calcula lista sugerida de compra basada en menú semanal, existencia y compras en orden. No registra compra.
    *   *Req query Sprint 5:* `mes` y `semana` obligatorios; `anio` opcional para fijar el año operativo.
    *   *Ejemplo recomendado:* `GET /api/compras/sugerencia?anio=2026&mes=4&semana=1`
    *   *Res `200 OK` Sprint 5:*
        ```json
        {
          "anio": 2026,
          "mes": 4,
          "semana": 1,
          "menu": {
            "id": 12,
            "estado": "BORRADOR",
            "items": [
              {
                "dia": "Lunes",
                "turno": "Almuerzo",
                "plato": "Pollo al horno",
                "porciones_estimadas": 120
              }
            ]
          },
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
    *   *Res `400 Bad Request`:* `{ "error": "Parámetros inválidos: mes debe ser 1-12 y semana 1-4" }`
    *   *Res `404 Not Found`:* `{ "error": "No existe menú para el mes y año seleccionados" }`

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
*   **GET `/vida-util/sugerir?insumo_id=2&fecha_recepcion=2026-05-03&temporada=Templado&madurez=Medio`** - Sugiere vida útil y fecha de vencimiento para lotes sin fecha impresa. No guarda inventario.
    *   *Req query Sprint 6:* `insumo_id` y `fecha_recepcion` obligatorios; `temporada` opcional (`Verano|Invierno|Templado`); `madurez` opcional (`Verde|Medio|Maduro|No aplica`).
    *   *Res `200 OK` con regla local:*
        ```json
        {
          "insumo_id": 2,
          "insumo": "Tomate",
          "categoria": "Verduras",
          "fecha_recepcion": "2026-05-03",
          "temporada": "Templado",
          "madurez": "Medio",
          "vida_util_dias_base": 5,
          "ajuste_temporada": 0,
          "ajuste_madurez": 0,
          "vida_util_sugerida_dias": 5,
          "fecha_vencimiento_sugerida": "2026-05-08",
          "fuente": "regla_insumo",
          "editable": true,
          "requiere_revision": false
        }
        ```
    *   *Res `200 OK` sin regla local Fase 1:*
        ```json
        {
          "insumo_id": 99,
          "insumo": "Producto sin regla",
          "fuente": "sin_regla",
          "editable": true,
          "requiere_revision": true,
          "mensaje": "Ingrese fecha manual o agregue regla de vida útil"
        }
        ```
    *   Fórmula: `vida_util_sugerida_dias = max(1, vida_util_dias_base + ajuste_temporada + ajuste_madurez)`.
    *   Fase 2 opcional: si `VIDA_UTIL_AI_ENABLED=true` y no hay regla local, puede llamar un estimador IA mediante interfaz interna. Por defecto queda desactivado.
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

## 4. Consumo (Comedor) - Sprint 3.1 Planning
Todos los endpoints usan JWT. El input QR es manual por ahora; no se planifica cámara ni OCR en este sprint. Las firmas se capturan dentro del software con canvas y se guardan como base64.

*   **POST `/trabajadores`** - Crear trabajador/comensal autorizado.
    *   *Roles:* `Gerente`.
    *   *Req:* `{ "ci": "1234567", "codigo_qr": "QR-1234567", "nombres": "Juan", "apellidos": "Perez", "cliente_id": 1, "estado": "Activo" }`
    *   *Validaciones:* `ci` único; `codigo_qr` único si se informa; `cliente_id` requerido; no borrar físico, usar estado.
    *   *Res `201 Created`:* `{ id, ci, codigo_qr, nombres, apellidos, cliente_id, estado }`
    *   *Res `400 Bad Request`:* `{ "error": "Trabajador ya registrado" }`
*   **GET `/trabajadores?ci=...&qr=...`** - Buscar trabajador por CI o código QR.
    *   *Roles:* `Cliente`, `Gerente`.
    *   *Req query:* al menos uno de `ci` o `qr`.
    *   *Res `200 OK`:* `{ id, ci, codigo_qr, nombres, apellidos, cliente, estado }`
    *   *Res `404 Not Found`:* `{ "error": "Trabajador no registrado", "accion": "registrar_trabajador" }`
    *   Nota UI: la opción **Registrar trabajador** solo se habilita para `Gerente`.
*   **POST `/consumos`** - Registrar consumo por fecha, turno y trabajador.
    *   *Roles:* `Cliente`, `Gerente`.
    *   *Req:* `{ "trabajador_id": 10, "fecha": "2026-05-23", "turno": "Almuerzo", "metodo_identificacion": "CI|QR" }`
    *   *Datos de auditoría:* `registrado_por` sale del JWT, no del body.
    *   *Validaciones:* trabajador activo; turno válido (`Desayuno|Almuerzo|Cena`); único por `trabajador_id + fecha + turno`.
    *   *Res `201 Created`:* `{ id, trabajador_id, fecha, turno, metodo_identificacion, registrado_por, estado_firma: "Pendiente" }`
    *   *Res `409 Conflict`:* `{ "error": "El trabajador ya registró consumo en este turno", "requiere_autorizacion_gerente": true }`
    *   Nota Sprint 3.1: la excepción de doble consumo queda planificada para `Gerente`, pero la primera implementación puede bloquear y mostrar el mensaje.
*   **GET `/consumos?fecha=YYYY-MM-DD&turno=Almuerzo`** - Listar consumos del día y turno.
    *   *Roles:* `Cliente`, `Gerente`.
    *   *Res `200 OK`:* `[{ id, fecha, turno, metodo_identificacion, trabajador: { id, ci, nombres, apellidos }, firma: { existe: true }, registrado_por }]`
*   **POST `/consumos/:id/firma`** - Guardar firma digital del trabajador asociada a un consumo.
    *   *Roles:* `Cliente`, `Gerente`.
    *   *Req:* `{ "firma_base64": "data:image/png;base64,..." }`
    *   *Validaciones:* consumo existe; firma no vacía; una firma activa por consumo.
    *   *Res `201 Created`:* `{ consumo_id, firmado_en, tiene_firma: true }`
*   **POST `/consumos/feedback`** - Envío de encuesta de trabajador. Se mantiene como flujo futuro/no prioritario.
*   **POST `/sync`** - Subida masiva desde aplicación PWA offline. No entra en Sprint 3.1.

## 5. Reportes y Facturas
*   **GET `/reportes/diario?fecha=YYYY-MM-DD&turno=Almuerzo`** - Consulta/genera reporte diario de consumos por fecha y turno.
    *   *Roles:* `Cliente`, `Gerente`.
    *   *Res `200 OK`:*
        ```json
        {
          "fecha": "2026-05-23",
          "turno": "Almuerzo",
          "estado": "Pendiente validación",
          "total_consumos": 2,
          "consumos": [
            {
              "id": 1,
              "trabajador": { "ci": "1234567", "nombre_completo": "Juan Perez" },
              "metodo_identificacion": "CI",
              "firmado": true,
              "registrado_por": { "id": 4, "nombre": "Cliente Obra" }
            }
          ],
          "validacion": null
        }
        ```
    *   Si ya fue validado, `estado = "Validado"` e incluye `validacion`.
    *   Nota técnica: `ReporteDiario` puede implementarse como vista calculada por `fecha + turno`; solo `ReporteValidacion` necesita persistencia obligatoria.
*   **POST `/reportes/diario/validar`** - Firma del cliente para validar reporte diario.
    *   *Roles:* `Cliente`.
    *   *Req:* `{ "fecha": "2026-05-23", "turno": "Almuerzo", "firma_base64": "data:image/png;base64,..." }`
    *   *Datos de auditoría:* `validado_por` y `validado_en` se toman del JWT/servidor.
    *   *Validaciones:* reporte no validado previamente; firma obligatoria; Cocina/Almacén no pueden validar.
    *   *Res `201 Created`:* `{ "fecha": "2026-05-23", "turno": "Almuerzo", "estado": "Validado", "validado_por": 4, "validado_en": "2026-05-23T18:10:00.000Z" }`
    *   *Res `409 Conflict`:* `{ "error": "El reporte ya fue validado" }`
*   **GET `/reportes/export`** - Generación de descarga (recibe param `format=pdf|excel`).
*   **POST `/facturacion`** - Genera bloque de facturación consolidando reportes validados.

## 6. Auth y RRHH
*   **POST `/auth/login`** - Obtener accessToken JWT.
*   **POST `/staff/marcar`** - Marcaje de asistencia del cocinero o gerente (tipo in/out).
