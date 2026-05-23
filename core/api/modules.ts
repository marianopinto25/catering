/**
 * REGISTRY de módulos API activos.
 * Para deshabilitar un módulo: comentar o eliminar su línea de import y entrada en activeModules.
 * El resto del proyecto seguirá compilando y funcionando.
 */
import type { Router } from 'express';
import authRouter from '../../modules/auth/api/routes';
import proveedoresRouter from '../../modules/proveedores/api/routes';
import insumosRouter from '../../modules/insumos/api/routes';
import comprasRouter from '../../modules/compras/api/routes';
import inventarioRouter from '../../modules/inventario/api/routes';
import alertasRouter from '../../modules/alertas/api/routes';
import vidaUtilRouter from '../../modules/vida-util/api/routes';
import { menusRouter, platosRouter } from '../../modules/menu/api/routes';
import trabajadoresRouter from '../../modules/trabajadores/api/routes';
import consumosRouter from '../../modules/consumos/api/routes';
import reportesRouter from '../../modules/reportes/api/routes';

export const activeModules: Array<{ path: string; router: Router }> = [
  { path: '/api/auth',        router: authRouter },
  { path: '/api/proveedores', router: proveedoresRouter },
  { path: '/api/insumos',     router: insumosRouter },
  { path: '/api/compras',     router: comprasRouter },
  { path: '/api/inventario',  router: inventarioRouter },
  { path: '/api/vida-util',   router: vidaUtilRouter },
  { path: '/api/alertas',     router: alertasRouter },
  { path: '/api/menus',       router: menusRouter },
  { path: '/api/platos',      router: platosRouter },
  { path: '/api/trabajadores', router: trabajadoresRouter },
  { path: '/api/consumos',    router: consumosRouter },
  { path: '/api/reportes',    router: reportesRouter },
];
