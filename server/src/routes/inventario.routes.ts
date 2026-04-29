import { Router } from 'express';
import * as InventarioController from '../controllers/inventario.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', InventarioController.getInventario);
router.post('/movimientos', InventarioController.ingresarCompraInventario);
router.post('/merma', InventarioController.registrarMerma);

export default router;
