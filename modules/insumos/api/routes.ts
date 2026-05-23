import { Router } from 'express';
import * as InsumosController from './controller';
import { authenticateToken, requireRoles } from '../../../core/api/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(['GERENTE', 'CHEF']));

router.get('/', InsumosController.getInsumos);
router.post('/', InsumosController.createInsumo);
router.put('/:id', InsumosController.updateInsumo);
router.delete('/:id', InsumosController.deleteInsumo);

export default router;
