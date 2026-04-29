"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeModules = void 0;
const routes_1 = __importDefault(require("../../modules/auth/api/routes"));
const routes_2 = __importDefault(require("../../modules/proveedores/api/routes"));
const routes_3 = __importDefault(require("../../modules/insumos/api/routes"));
const routes_4 = __importDefault(require("../../modules/compras/api/routes"));
const routes_5 = __importDefault(require("../../modules/inventario/api/routes"));
const routes_6 = __importDefault(require("../../modules/alertas/api/routes"));
exports.activeModules = [
    { path: '/api/auth', router: routes_1.default },
    { path: '/api/proveedores', router: routes_2.default },
    { path: '/api/insumos', router: routes_3.default },
    { path: '/api/compras', router: routes_4.default },
    { path: '/api/inventario', router: routes_5.default },
    { path: '/api/alertas', router: routes_6.default },
];
