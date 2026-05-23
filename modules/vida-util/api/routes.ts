import { Router } from 'express';
import { authenticateToken } from '../../../core/api/auth.middleware';
import * as VidaUtilController from './controller';

const router = Router();

router.use(authenticateToken);

router.get('/sugerir', VidaUtilController.sugerirVidaUtil);

export default router;
