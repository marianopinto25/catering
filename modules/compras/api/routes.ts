import { Router } from 'express';
import * as ComprasController from '../controllers/compras.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', ComprasController.registrarCompra);
router.get('/', ComprasController.getCompras);
router.get('/:id', ComprasController.getCompraById);

export default router;
