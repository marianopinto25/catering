import { Router } from 'express';
import * as InsumosController from '../controllers/insumos.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', InsumosController.getInsumos);
router.post('/', InsumosController.createInsumo);
router.put('/:id', InsumosController.updateInsumo);
router.delete('/:id', InsumosController.deleteInsumo);

export default router;
