import { Router } from 'express';
import { authenticateToken } from '../../../core/api/auth.middleware';
import * as TrabajadoresController from './controller';

const router = Router();

router.use(authenticateToken);

router.get('/clientes', TrabajadoresController.getClientes);
router.get('/', TrabajadoresController.getTrabajadores);
router.post('/', TrabajadoresController.createTrabajador);
router.post('/:id/cuenta', TrabajadoresController.createCuentaTrabajador);
router.put('/:id', TrabajadoresController.updateTrabajador);

export default router;
