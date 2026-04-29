import { Router } from 'express';
import * as InventarioController from './controller';
import { authenticateToken } from '../../../core/api/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', InventarioController.getInventario);
router.post('/movimientos', InventarioController.ingresarCompraInventario);
router.post('/merma', InventarioController.registrarMerma);

export default router;
