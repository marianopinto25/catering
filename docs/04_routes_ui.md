# UI Routes & Pantallas (React)

## Layout Principal
`Route: /` -> Componente base que verifica el Login y el Rol del usuario. En caso válido inyecta el `Sidebar` (Manejo de Inventarios y Compras, Proveedores, Inventario, Menú, Comedor, Reportes, Usuarios) y un `TopBar` (Notificaciones/Alertas, Usuario).

*Estilo General:* Fondo de la app blanco o ligeramente gris (`#FAFAFA`). Tarjetas blancas con algo de sombra, bordes redondeados. Textos en negro o grices oscuros (Inter font). Microinteracciones usando `framer-motion` (ej. fade-in de modales, opacidad en lista).

## 1. Manejo de Inventarios y Compras
*   `GET /dashboard`
    1. Título visible: **Manejo de Inventarios y Compras**.
    2. Tarjetas superiores: alertas de inventario, compras pendientes de ingreso y próximos vencimientos.
    3. No usar el texto "Panel de control" ni "Dashboard" en labels visibles para el usuario.

## 2. Proveedores y Compras
*   `GET /proveedores` -> Listado de proveedores, mostrando empresa y persona responsable.
*   `GET /proveedores/nuevo` -> Formulario de proveedor con responsable: nombre, cargo, teléfono y email.
*   `GET /proveedores/:id/editar` -> Edición de empresa y responsable.
*   `GET /compras` -> Listado histórico de facturas de compra.
*   `GET /compras/nueva` -> Pantalla operativa multi-panel para registrar compra. Gatilla CU-04 y Sprint 5.
    *   **Panel izquierdo fijo operativo:** proveedor, fecha, año/mes/semana del menú, estado de carga y acción de guardado.
    *   **Panel centro principal:** grilla editable de compra con insumo, unidad, cantidad, precio unitario, subtotal y acciones de agregar/quitar línea.
    *   **Panel derecho superior:** menú de la semana seleccionada, solo lectura, agrupado por día y servicio.
    *   **Panel derecho inferior:** sugerencia de compra por insumo con requerido, existencia, en orden, sugerido y unidad.
    *   Acción principal: **Copiar sugerencia a la compra**, que llena la grilla central con las cantidades sugeridas.
    *   Comportamiento: al cambiar año/mes/semana se refrescan menú y sugerencia; la grilla no se sobrescribe hasta presionar **Copiar sugerencia a la compra**.
    *   Defensibilidad: cada fila sugerida debe mostrar la unidad y los factores `Requerido`, `Existencia` y `En orden` para responder cómo se determinó la cantidad.

### Wireframe textual Sprint 5
```text
┌──────────────────────┬────────────────────────────────────┬─────────────────────────────┐
│ Datos de compra      │ Grilla de compra                    │ Menú semana seleccionada     │
│ Proveedor            │ Insumo | Unidad | Cant. | Precio    │ Día | Servicio | Plato | Porc│
│ Fecha                │ Arroz  | Kg     | 7.4   | 0.00      │ Lunes | Almuerzo | ...       │
│ Año / Mes / Semana   │ + agregar/quitar línea              │                             │
│ Guardar compra       │ Total compra                        ├─────────────────────────────┤
│                      │                                    │ Sugerencia de compra         │
│                      │                                    │ Insumo | Req | Exist | Orden │
│                      │                                    │ Sug | Unidad                  │
│                      │                                    │ [Copiar sugerencia a compra] │
└──────────────────────┴────────────────────────────────────┴─────────────────────────────┘
```

## 3. Inventario y Alertas
*   `GET /insumos` -> Catálogo maestro de insumos (CRUD básico). CU-06.
*   `GET /insumos/:id/editar` -> Edición de stock mínimo, nombre, unidad. CU-06.
*   `GET /inventario` -> Vista de resumen por insumo. Debe mostrar las columnas:
    *   Existencia (`onHand`)
    *   En orden (`onOrder`)
    *   Solicitado (`requested`)
    *   No mostrar "estado" como columna principal para usuario.
*   `GET /alertas` -> Alertas redactadas para anticipación del chef/cocina. CU-10 y CU-11.
*   **Modales Operativos**:
    *   `Ingresar Insumo` / `Recibir mercancía`: formulario de lotes recibidos desde una compra pendiente. Sprint 6 agrega sugerencia automática de vencimiento cuando el producto no tiene fecha impresa.
        *   Por cada lote se muestra: insumo, cantidad recibida, código de lote, check **Tiene fecha impresa**, fecha de vencimiento, temporada y madurez.
        *   Si **Tiene fecha impresa** está activo, el usuario ingresa la fecha real y el sistema no la reemplaza.
        *   Si **Tiene fecha impresa** está inactivo, al seleccionar insumo/temporada/madurez se consulta la sugerencia y se autocompleta la fecha.
        *   La fecha sugerida siempre queda editable antes de guardar.
        *   Debe mostrarse la fuente de la sugerencia: regla por insumo, regla por categoría, sin regla o IA opcional.
    *   `Ajuste de Inventario`: Registrar vencido, dañado o sobrante como transacción de ajuste. CU-08, CU-09.

### Wireframe textual Sprint 6
```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Recibir mercancía - Compra #123                                            │
│ Insumo      Cantidad   Lote     Fecha impresa   Temporada   Madurez        │
│ Tomate      10 Kg      T-001    [ ]            Templado    Medio          │
│ Fecha vencimiento: 08/05/2026  (Sugerida por regla de insumo, editable)     │
│                                                                            │
│ Leche       12 L       L-221    [x]            No aplica   No aplica       │
│ Fecha vencimiento: [fecha escrita por usuario]                             │
│                                                                            │
│ [Guardar ingreso a inventario]                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## 4. Menú y Cocina
*   `GET /menu` -> Pantalla principal de menú mensual multi-panel. Sprint 4.
    *   **Panel izquierdo:** selector Semana 1, Semana 2, Semana 3, Semana 4; mes/año activo.
    *   **Panel izquierdo / carga:** importador CSV exportado desde Excel con columnas `semana,dia,turno,plato,porciones`.
    *   **Panel centro:** matriz de días contra servicios `Desayuno`, `Almuerzo`, `Cena`, con plato y porciones estimadas.
    *   **Panel derecho:** receta del plato seleccionado y requerimiento semanal consolidado por insumo.
*   `GET /menu/platos` -> Gestión rápida de catálogo de platos y receta mínima.
*   `GET /menu/calendario` -> Alias futuro o vista alternativa en formato calendario por día; no es prioridad Sprint 4.
*   `GET /cocina/actual` -> Resumen de qué preparar hoy especial para el usuario "Cocinero". Botones para "Retirar Insumos" y "Reportar Incidencias".
*   `GET /produccion` -> Registro de producción con descuento FEFO y Kardex.
    *   Roles: `Gerente`, `Cocinero`, `Almacen`.
    *   Panel de captura: plato, porciones, fecha, turno y observación.
    *   Panel de receta: muestra insumos requeridos para las porciones antes de registrar.
    *   Si falta stock, muestra bloque de faltantes con requerido, disponible y faltante por insumo.
    *   Historial: lista producciones recientes y los lotes usados por FEFO.
    *   Kardex: tabla de movimientos recientes, incluyendo `Salida` por producción.

### Wireframe textual Sprint 4
```text
┌────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Semana 1           │ Día        Desayuno Almuerzo  │ Plato seleccionado            │
│ Semana 2           │ Lunes      Plato A  Plato B   │ - Receta mínima               │
│ Semana 3           │ Martes     Plato C  Plato D   │   Insumo | Cant/porción       │
│ Semana 4           │ Carga CSV  Cena               │ Requerimiento semanal         │
│ Mes/Año activo     │ + Editar servicio seleccionado│ Insumo | Total requerido      │
│ Formato CSV        │ Porciones estimadas por turno │ Suma los 3 servicios          │
└────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

## 5. Comedor Front (Tableta o Kiosco) - Sprint 3.1 Planning
*   `GET /comedor/consumo` -> Registro operativo de consumo con identificación y firma.
    *   Roles: `Cliente`, `Gerente`.
    *   Pantalla de uso rápido con selector de turno (`Desayuno`, `Almuerzo`, `Cena`), fecha operativa y control segmentado de método (`CI`, `QR`).
    *   Input manual grande para CI o código QR. También acepta enlaces escaneados con `?qr=<codigo_qr>` y busca automáticamente al trabajador.
    *   Al buscar trabajador:
        *   Si existe y está activo, mostrar nombre completo, CI, cliente y botón **Registrar consumo**.
        *   Si no existe, mostrar mensaje claro: **Trabajador no registrado**.
        *   Solo para `Gerente`, mostrar acción **Registrar trabajador**.
    *   Después de registrar consumo, mostrar canvas de firma del trabajador con acciones **Limpiar firma** y **Guardar firma**.
    *   Si el trabajador ya consumió en el mismo turno/día, bloquear el registro y mostrar alerta visible. Para Sprint 3.1 queda planificada la autorización de `Gerente`.
*   `GET /comedor/trabajadores` -> Listado y mantenimiento del padrón de trabajadores con QR generado.
    *   Roles: `Gerente`.
    *   Tabla con CI, código QR, QR visual escaneable, enlace profundo de consumo, cliente, estado y acciones editar/desactivar.
*   `GET /comedor/trabajadores/nuevo` -> Formulario de alta de trabajador.
    *   Roles: `Gerente`.
    *   Campos: CI, código QR opcional, nombres, apellidos, cliente, estado. Si no se escribe código QR, el backend lo genera.
    *   Debe poder abrirse desde el flujo de consumo cuando la búsqueda no encuentra trabajador.

### Wireframe textual Sprint 3.1 - Registro de consumo
```text
┌─────────────────────────────────────────────────────────────────────┐
│ Consumo de comensales                         Fecha: 23/05/2026     │
│ Turno: [Desayuno] [Almuerzo] [Cena]            Método: [CI] [QR]     │
│                                                                     │
│ CI o código QR                                                      │
│ [ 1234567                                      ] [Buscar]           │
│                                                                     │
│ Trabajador validado                                                 │
│ Juan Perez · CI 1234567 · Cliente Obra Central                      │
│ [Registrar consumo]                                                 │
│                                                                     │
│ Firma del trabajador                                                │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │                                                               │   │
│ │                    canvas de firma                            │   │
│ │                                                               │   │
│ └───────────────────────────────────────────────────────────────┘   │
│ [Limpiar firma]                                  [Guardar firma]    │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Reportes
*   `GET /reportes` -> Selector de rangos de fechas (Datepicker).
    *   Botones "Exportar PDF" (ícono rojo) y "Exportar Excel" (ícono verde).
*   `GET /reportes/diario` -> Reporte diario de consumos por fecha y turno.
    *   Roles: `Cliente`, `Gerente`.
    *   Filtros superiores: fecha y turno.
    *   Tabla: trabajador, CI, método de identificación, registrado por, hora de registro, firma del trabajador.
    *   Estado visible: **Pendiente validación** o **Validado**.
    *   Si está pendiente y el usuario tiene rol `Cliente`, mostrar panel de firma del cliente.
    *   Si está validado, mostrar quién validó, fecha/hora y firma guardada.
    *   Cocina y Almacén no deben ver acción de validación.
*   `GET /reportes/diario/validar` -> Vista enfocada de validación del cliente.
    *   Roles: `Cliente`.
    *   Puede ser una subvista o panel dentro de `/reportes/diario`.
    *   Muestra resumen de consumos, total por turno y canvas de firma del cliente.

### Wireframe textual Sprint 3.1 - Validación de reporte diario
```text
┌─────────────────────────────────────────────────────────────────────┐
│ Reporte diario                              Estado: Pendiente       │
│ Fecha [23/05/2026]   Turno [Almuerzo]       Total consumos: 42       │
│                                                                     │
│ CI        Trabajador        Método     Registrado por     Firma      │
│ 1234567   Juan Perez        CI         Cliente Obra       Ver        │
│ 7654321   Maria Rojas       QR         Cliente Obra       Ver        │
│                                                                     │
│ Validación del cliente                                               │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │                    canvas de firma cliente                    │   │
│ └───────────────────────────────────────────────────────────────┘   │
│ [Limpiar firma]                               [Validar reporte]     │
└─────────────────────────────────────────────────────────────────────┘
```

## 7. Usuarios y Facturación
*   `GET /configuracion/usuarios` -> Tabla de staff.
*   `GET /facturas` -> Listado de cobros hacia el gestor constructor.
