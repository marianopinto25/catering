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
*   `GET /compras/nueva` -> Formulario Wizard para registrar compra. Permite buscar insumos existentes o crear uno rápido. Gatilla CU-04.

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
    *   `Ingresar Insumo`: Formulario manual (CU-05).
    *   `Ajuste de Inventario`: Registrar vencido, dañado o sobrante como transacción de ajuste. CU-08, CU-09.

## 4. Menú y Cocina
*   `GET /menu` -> Pantalla principal de menú mensual multi-panel. Sprint 4.
    *   **Panel izquierdo:** selector Semana 1, Semana 2, Semana 3, Semana 4; mes/año activo.
    *   **Panel izquierdo / carga:** importador CSV exportado desde Excel con columnas `semana,dia,turno,plato,porciones`.
    *   **Panel centro:** matriz de días contra servicios `Desayuno`, `Almuerzo`, `Cena`, con plato y porciones estimadas.
    *   **Panel derecho:** receta del plato seleccionado y requerimiento semanal consolidado por insumo.
*   `GET /menu/platos` -> Gestión rápida de catálogo de platos y receta mínima.
*   `GET /menu/calendario` -> Alias futuro o vista alternativa en formato calendario por día; no es prioridad Sprint 4.
*   `GET /cocina/actual` -> Resumen de qué preparar hoy especial para el usuario "Cocinero". Botones para "Retirar Insumos" y "Reportar Incidencias".

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

## 5. Comedor Front (Tableta o Kiosco)
*   `GET /comedor` -> Módulo especial. UI máxima escala, enfocado en input rápido (lector QR o teclado número grande).
    *   Mensajes grandes y centricos: "Juan Perez validado O.K.", "Doble consumo detectado" (con alertas rojas evidentes).
    *   Al final pide puntuación "⭐⭐⭐⭐⭐".

## 6. Reportes
*   `GET /reportes` -> Selector de rangos de fechas (Datepicker).
    *   Botones "Exportar PDF" (ícono rojo) y "Exportar Excel" (ícono verde).

## 7. Usuarios y Facturación
*   `GET /configuracion/usuarios` -> Tabla de staff.
*   `GET /facturas` -> Listado de cobros hacia el gestor constructor.
