import { Router } from 'express';
import * as AlertasController from '../controllers/alertas.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', AlertasController.getAlertas);

export default router;
