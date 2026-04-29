import { Router } from 'express';
import { getProveedores, createProveedor, editProveedor, deleteProveedor } from './controller';
import { requireAuth, requireGerente } from '../../../core/api/auth.middleware';

const router = Router();

// Todas las rutas de proveedores requieren Auth y Rol de Gerente según matriz de permisos
router.use(requireAuth);
router.use(requireGerente);

router.get('/', getProveedores);
router.post('/', createProveedor);
router.put('/:id', editProveedor);
router.delete('/:id', deleteProveedor);

export default router;
