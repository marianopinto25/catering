import { Router } from 'express';
import { authenticateToken } from '../../../core/api/auth.middleware';
import * as ConsumosController from './controller';

const router = Router();

router.use(authenticateToken);

router.get('/', ConsumosController.getConsumos);
router.post('/', ConsumosController.createConsumo);
router.post('/:id/firma', ConsumosController.saveFirma);

export default router;
