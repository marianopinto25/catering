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
import Dashboard from '../../apps/web/src/Dashboard';

// Rutas públicas (sin layout)
export const publicRoutes: RouteObject[] = [
  { path: '/login', element: <Login /> },
];

// Rutas protegidas (con Sidebar + ProtectedRoute en App.tsx)
export const protectedRoutes: RouteObject[] = [
  { path: '/dashboard',            element: <Dashboard /> },
  // --- módulo/proveedores ---
  { path: '/proveedores',           element: <ProveedoresList /> },
  { path: '/proveedores/nuevo',     element: <ProveedorForm /> },
  { path: '/proveedores/:id/editar',element: <ProveedorForm /> },
  // --- módulo/insumos ---
  { path: '/insumos',               element: <InsumosList /> },
  { path: '/insumos/nuevo',         element: <InsumoForm /> },
  { path: '/insumos/:id/editar',    element: <InsumoForm /> },
  // --- módulo/compras ---
  { path: '/compras',               element: <ComprasPage /> },
  { path: '/compras/nueva',         element: <NuevaCompraForm /> },
  // --- módulo/inventario ---
  { path: '/inventario',            element: <InventarioPage /> },
  { path: '/inventario/ingreso',    element: <IngresoInventarioForm /> },
  // --- módulo/alertas ---
  { path: '/alertas',               element: <AlertasPage /> },
];
