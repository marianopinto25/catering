import { Router } from 'express';
import * as AlertasController from './controller';
import { authenticateToken, requireRoles } from '../../../core/api/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles(['GERENTE', 'CHEF']));

router.get('/', AlertasController.getAlertas);

export default router;
