import { Router } from 'express';
import * as InventarioController from './controller';
import { authenticateToken, requireRoles } from '../../../core/api/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(['GERENTE', 'CHEF']));

router.get('/resumen', InventarioController.getResumenInventario);
router.get('/', InventarioController.getInventario);
router.post('/movimientos', InventarioController.ingresarCompraInventario);
router.post('/merma', InventarioController.registrarMerma);

export default router;
