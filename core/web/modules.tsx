/**
 * REGISTRY de módulos UI activos.
 * Para deshabilitar un módulo: comentar o eliminar su bloque de rutas.
 * El resto de la app seguirá compilando y funcionando.
 */
import type { RouteObject } from 'react-router-dom';
import Login from '../../modules/auth/ui/Login';
import ProveedoresList from '../../modules/proveedores/ui/ProveedoresList';
import ProveedorForm from '../../modules/proveedores/ui/ProveedorForm';
import InsumosList from '../../modules/insumos/ui/InsumosList';
import InsumoForm from '../../modules/insumos/ui/InsumoForm';
import ComprasPage from '../../modules/compras/ui/ComprasPage';
import NuevaCompraForm from '../../modules/compras/ui/NuevaCompraForm';
import InventarioPage from '../../modules/inventario/ui/InventarioPage';
import IngresoInventarioForm from '../../modules/inventario/ui/IngresoInventarioForm';
import AlertasPage from '../../modules/alertas/ui/AlertasPage';
import MenuMensualPage from '../../modules/menu/ui/MenuMensualPage';
import RecetasPage from '../../modules/menu/ui/RecetasPage';
import ConsumoPage from '../../modules/consumos/ui/ConsumoPage';
import MiConsumoPage from '../../modules/consumos/ui/MiConsumoPage';
import ConsumosDiaPage from '../../modules/consumos/ui/ConsumosDiaPage';
import TrabajadoresPage from '../../modules/trabajadores/ui/TrabajadoresPage';
import ReporteDiarioPage from '../../modules/reportes/ui/ReporteDiarioPage';
import ProduccionPage from '../../modules/produccion/ui/ProduccionPage';
import Dashboard from '../../apps/web/src/Dashboard';

export type AppRouteObject = RouteObject & {
  roles?: string[];
};

// Rutas públicas (sin layout)
export const publicRoutes: RouteObject[] = [
  { path: '/login', element: <Login /> },
];

// Rutas protegidas (con Sidebar + ProtectedRoute en App.tsx)
export const protectedRoutes: AppRouteObject[] = [
  { path: '/dashboard',            element: <Dashboard />, roles: ['GERENTE'] },
  // --- módulo/proveedores ---
  { path: '/proveedores',           element: <ProveedoresList />, roles: ['GERENTE'] },
  { path: '/proveedores/nuevo',     element: <ProveedorForm />, roles: ['GERENTE'] },
  { path: '/proveedores/:id/editar',element: <ProveedorForm />, roles: ['GERENTE'] },
  // --- módulo/insumos ---
  { path: '/insumos',               element: <InsumosList />, roles: ['GERENTE', 'CHEF'] },
  { path: '/insumos/nuevo',         element: <InsumoForm />, roles: ['GERENTE', 'CHEF'] },
  { path: '/insumos/:id/editar',    element: <InsumoForm />, roles: ['GERENTE', 'CHEF'] },
  // --- módulo/compras ---
  { path: '/compras',               element: <ComprasPage />, roles: ['GERENTE'] },
  { path: '/compras/nueva',         element: <NuevaCompraForm />, roles: ['GERENTE'] },
  // --- módulo/inventario ---
  { path: '/inventario',            element: <InventarioPage />, roles: ['GERENTE', 'CHEF'] },
  { path: '/inventario/ingreso',    element: <IngresoInventarioForm />, roles: ['GERENTE', 'CHEF'] },
  // --- módulo/alertas ---
  { path: '/alertas',               element: <AlertasPage />, roles: ['GERENTE', 'CHEF'] },
  // --- módulo/menú ---
  { path: '/menu',                   element: <MenuMensualPage />, roles: ['GERENTE', 'CHEF'] },
  { path: '/menu/platos',            element: <MenuMensualPage />, roles: ['GERENTE', 'CHEF'] },
  { path: '/menu/recetas',           element: <RecetasPage />, roles: ['GERENTE', 'CHEF'] },
  // --- módulo/comedor ---
  { path: '/comedor/consumo',         element: <ConsumoPage />, roles: ['GERENTE'] },
  { path: '/comedor/trabajadores',    element: <TrabajadoresPage />, roles: ['GERENTE'] },
  { path: '/trabajadores',            element: <TrabajadoresPage />, roles: ['GERENTE'] },
  { path: '/mi-consumo',              element: <MiConsumoPage />, roles: ['TRABAJADOR'] },
  { path: '/consumos',                element: <ConsumosDiaPage />, roles: ['GERENTE'] },
  // --- módulo/reportes ---
  { path: '/reportes/diario',          element: <ReporteDiarioPage />, roles: ['GERENTE'] },
  // --- módulo/producción ---
  { path: '/produccion',               element: <ProduccionPage />, roles: ['CHEF'] },
];
