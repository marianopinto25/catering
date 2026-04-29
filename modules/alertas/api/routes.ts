import { Router } from 'express';
import * as AlertasController from './controller';
import { authenticateToken } from '../../../core/api/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', AlertasController.getAlertas);

export default router;
