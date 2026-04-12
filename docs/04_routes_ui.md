# UI Routes & Pantallas (React)

## Layout Principal
`Route: /` -> Componente base que verifica el Login y el Rol del usuario. En caso válido inyecta el `Sidebar` (Dashboard, Proveedores, Inventario, Menú, Comedor, Reportes, Usuarios) y un `TopBar` (Notificaciones/Alertas, Usuario).

*Estilo General:* Fondo de la app blanco o ligeramente gris (`#FAFAFA`). Tarjetas blancas con algo de sombra, bordes redondeados. Textos en negro o grices oscuros (Inter font). Microinteracciones usando `framer-motion` (ej. fade-in de modales, opacidad en lista).

## 1. Dashboard (Todas las visuales)
*   `GET /dashboard`
    1. Tarjetas Superiores (Cards minimalistas): Consumos de hoy, Stock Alertas.
    2. Tabla resumen (menú del día).

## 2. Pautas y Compras
*   `GET /proveedores`
    *   Tabla estilo Material-UI o Tailwind-Tables limpia. Botón negro "Nuevo Proveedor".
*   `GET /proveedores/crear` ó Modal centrado `Crear Proveedor`.
*   `GET /compras/nueva`
    *   Formulario tipo "Asistente" (Wizard) simple. Búsqueda de proveedor -> agregar items insumos dinámicos en lista -> Guardar.

## 3. Inventario
*   `GET /inventario`
    *   Tabla con buscador, indicador rojo/verde si necesita reponer stock o está próximo a caducar.
*   `POST /inventario/merma` -> Renderizado en modal para retirar stock.

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
