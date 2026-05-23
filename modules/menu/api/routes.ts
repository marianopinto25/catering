import { Router } from 'express';
import { authenticateToken } from '../../../core/api/auth.middleware';
import * as MenuController from './controller';

export const menusRouter = Router();
export const platosRouter = Router();

menusRouter.use(authenticateToken);
platosRouter.use(authenticateToken);

menusRouter.get('/', MenuController.getMenus);
menusRouter.post('/', MenuController.createMenu);
menusRouter.put('/:id', MenuController.updateMenu);
menusRouter.post('/:id/items', MenuController.addMenuItem);
menusRouter.put('/:id/items/:itemId', MenuController.updateMenuItem);
menusRouter.delete('/:id/items/:itemId', MenuController.deleteMenuItem);
menusRouter.get('/:id/requerimiento-semanal', MenuController.getRequerimientoSemanal);

platosRouter.get('/', MenuController.getPlatos);
platosRouter.get('/sugerir', MenuController.suggestPlato);
platosRouter.post('/', MenuController.createPlato);
platosRouter.put('/:id', MenuController.updatePlato);
platosRouter.delete('/:id', MenuController.deletePlato);
platosRouter.get('/:id/receta', MenuController.getReceta);
platosRouter.get('/:id/receta-pasos', MenuController.getRecetaPasos);
platosRouter.put('/:id/receta-pasos', MenuController.updateRecetaPasos);
platosRouter.post('/:id/receta-pasos/regenerar', MenuController.regenerateRecetaPasos);
platosRouter.post('/:id/receta', MenuController.addRecetaItem);
platosRouter.put('/:id/receta/:recetaId', MenuController.updateRecetaItem);
platosRouter.delete('/:id/receta/:recetaId', MenuController.deleteRecetaItem);
