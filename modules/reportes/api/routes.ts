import { Router } from 'express';
import { authenticateToken } from '../../../core/api/auth.middleware';
import * as ReportesController from './controller';

const router = Router();

router.use(authenticateToken);

router.get('/diario', ReportesController.getReporteDiario);
router.post('/diario/validar', ReportesController.validarReporteDiario);

export default router;
