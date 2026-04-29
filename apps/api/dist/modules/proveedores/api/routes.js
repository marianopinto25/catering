"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const auth_middleware_1 = require("../../../core/api/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas de proveedores requieren Auth y Rol de Gerente según matriz de permisos
router.use(auth_middleware_1.requireAuth);
router.use(auth_middleware_1.requireGerente);
router.get('/', controller_1.getProveedores);
router.post('/', controller_1.createProveedor);
router.put('/:id', controller_1.editProveedor);
router.delete('/:id', controller_1.deleteProveedor);
exports.default = router;
