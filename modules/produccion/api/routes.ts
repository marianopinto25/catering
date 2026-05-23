import { Router } from 'express';
import { authenticateToken } from '../../../core/api/auth.middleware';
import * as ProduccionController from './controller';

const router = Router();

router.use(authenticateToken);

router.get('/', ProduccionController.getProducciones);
router.get('/kardex', ProduccionController.getKardex);

export default router;
