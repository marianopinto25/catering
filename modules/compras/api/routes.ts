import { Router } from 'express';
import * as ComprasController from './controller';
import { authenticateToken } from '../../../core/api/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', ComprasController.registrarCompra);
router.get('/', ComprasController.getCompras);
router.get('/sugerencia', ComprasController.getSugerenciaCompra);
router.get('/:id', ComprasController.getCompraById);

export default router;
