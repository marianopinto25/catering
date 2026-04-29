# UI Routes & Pantallas (React)

## Layout Principal
`Route: /` -> Componente base que verifica el Login y el Rol del usuario. En caso válido inyecta el `Sidebar` (Dashboard, Proveedores, Inventario, Menú, Comedor, Reportes, Usuarios) y un `TopBar` (Notificaciones/Alertas, Usuario).

*Estilo General:* Fondo de la app blanco o ligeramente gris (`#FAFAFA`). Tarjetas blancas con algo de sombra, bordes redondeados. Textos en negro o grices oscuros (Inter font). Microinteracciones usando `framer-motion` (ej. fade-in de modales, opacidad en lista).

## 1. Dashboard (Todas las visuales)
*   `GET /dashboard`
    1. Tarjetas Superiores (Cards minimalistas): Consumos de hoy, Stock Alertas.
    2. Tabla resumen (menú del día).

## 2. Pautas y Compras
*   `GET /compras` -> Listado histórico de facturas de compra.
*   `GET /compras/nueva` -> Formulario Wizard para registrar compra. Permite buscar insumos existentes o crear uno rápido. Gatilla CU-04.

## 3. Inventario y Alertas
*   `GET /insumos` -> Catálogo maestro de insumos (CRUD básico). CU-06.
*   `GET /insumos/:id/editar` -> Edición de stock mínimo, nombre, unidad. CU-06.
*   `GET /inventario` -> Vista de stock actual consolidado y por lotes. CU-07.
*   `GET /alertas` -> Panel central de alertas. CU-10 y CU-11.
*   **Modales Operativos**:
    *   `Ingresar Insumo`: Formulario manual (CU-05).
    *   `Marcar Vencido/Dañado`: Cambio de estado de un lote (CU-08, CU-09).

## 4. Menú y Cocina
*   `GET /menu/calendario` -> Vista en formato calendario por día.
*   `GET /cocina/actual` -> Resumen de qué preparar hoy especial para el usuario "Cocinero". Botones para "Retirar Insumos" y "Reportar Incidencias".

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
