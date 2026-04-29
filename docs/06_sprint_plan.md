# Plan de Sprints

## Sprint 0: Preparación y Arquitectura
*   **Duración**: 1 semana.
*   **Backend:**
    *   Configuración inicial Node.js + Express (TypeScript).
    *   Setup de Prisma ORM (o Mongoose si es NoSQL, asumiendo base relacional PostgreSQL/MySQL) y conexión a la base de datos.
    *   Configurar JWT base para Auth.
*   **Frontend:**
    *   Crear proyecto React (Vite + TypeScript).
    *   Configurar tailwindcss (o Vanilla CSS con variables sólidas según preferencia y requerimiento estricto) junto con framer-motion general.
    *   Crear layout Dashboard básico vacio (Sidebar, Header, area de contenido).

## Sprint 1: Gestión de Abastecimientos inicial
**Objetivo:** Tener andando todo el Módulo Proveedores, Compras e Inventario Básico.

1.  **Backend:**
    *   CRUD `Proveedores`.
    *   Creación de endpoint y lógica para registrar `Compras` de insumos a un proveedor.
    *   Endpoints del `Inventario` (básico: entradas, ver stock).
    *   Endpoint de `Alertas` automatizado validando bajo stock o insumos vencidos en DB.
2.  **Frontend:**
    *   Pantalla "/proveedores" (Lista).
    *   Componente form "Nuevo Proveedor".
    *   Pantalla "/compras/nueva".
    *   Pantalla "/inventario" con listado general.
    *   Widgets básicos en el Dashboard (Mostrar la alerta de inventario si hay llamados).
3.  **UI/UX:**
    *   Aplicar estética blaca/negra, limpia con tipografía moderna, sin recargas.
    *   Animaciones sutiles (fade al abrir un modal de agregar proveedor, hover suave en botones).

## Sprints Posteriores (Sugeridos)
*   **Sprint 2:** Menús, Cocina, y salidas de Inventario (Mermas, cocina).
*   **Sprint 3:** Comedor: Asistencia final, consumos de trabajadores, lector QR.
*   **Sprint 4:** Reportes, PDF, Exporte, Validaciones de Cliente y Facturación. Feedback. Offline Mode.
