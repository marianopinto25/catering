import { Router } from 'express';
import { authenticateToken, forbidRoles, requireRoles } from '../../../core/api/auth.middleware';
import * as ProduccionController from './controller';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRoles(['CHEF']), ProduccionController.getProducciones);
router.post('/', forbidRoles(['GERENTE']), requireRoles(['CHEF']), ProduccionController.registrarProduccion);
router.get('/kardex', requireRoles(['CHEF']), ProduccionController.getKardex);

export default router;
