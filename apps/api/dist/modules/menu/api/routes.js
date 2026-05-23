"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.platosRouter = exports.menusRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../../core/api/auth.middleware");
const MenuController = __importStar(require("./controller"));
exports.menusRouter = (0, express_1.Router)();
exports.platosRouter = (0, express_1.Router)();
exports.menusRouter.use(auth_middleware_1.authenticateToken);
exports.platosRouter.use(auth_middleware_1.authenticateToken);
exports.menusRouter.get('/', MenuController.getMenus);
exports.menusRouter.post('/', MenuController.createMenu);
exports.menusRouter.put('/:id', MenuController.updateMenu);
exports.menusRouter.post('/:id/items', MenuController.addMenuItem);
exports.menusRouter.put('/:id/items/:itemId', MenuController.updateMenuItem);
exports.menusRouter.delete('/:id/items/:itemId', MenuController.deleteMenuItem);
exports.menusRouter.get('/:id/requerimiento-semanal', MenuController.getRequerimientoSemanal);
exports.platosRouter.get('/', MenuController.getPlatos);
exports.platosRouter.get('/sugerir', MenuController.suggestPlato);
exports.platosRouter.post('/', MenuController.createPlato);
exports.platosRouter.put('/:id', MenuController.updatePlato);
exports.platosRouter.delete('/:id', MenuController.deletePlato);
exports.platosRouter.get('/:id/receta', MenuController.getReceta);
exports.platosRouter.get('/:id/receta-pasos', MenuController.getRecetaPasos);
exports.platosRouter.put('/:id/receta-pasos', MenuController.updateRecetaPasos);
exports.platosRouter.post('/:id/receta-pasos/regenerar', MenuController.regenerateRecetaPasos);
exports.platosRouter.post('/:id/receta', MenuController.addRecetaItem);
exports.platosRouter.put('/:id/receta/:recetaId', MenuController.updateRecetaItem);
exports.platosRouter.delete('/:id/receta/:recetaId', MenuController.deleteRecetaItem);
