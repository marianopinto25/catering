"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.forbidRoles = exports.requireRoles = exports.requireGerente = exports.requireAuth = exports.normalizeRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-mock';
const normalizeRole = (role) => String(role || '').trim().toUpperCase();
exports.normalizeRole = normalizeRole;
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No se proporcionó token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};
exports.requireAuth = requireAuth;
const requireGerente = (req, res, next) => {
    if (!req.user || (0, exports.normalizeRole)(req.user.rol) !== 'GERENTE') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    }
    next();
};
exports.requireGerente = requireGerente;
const requireRoles = (roles) => (req, res, next) => {
    const allowed = new Set(roles.map(exports.normalizeRole));
    if (!req.user || !allowed.has((0, exports.normalizeRole)(req.user.rol))) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
};
exports.requireRoles = requireRoles;
const forbidRoles = (roles) => (req, res, next) => {
    const blocked = new Set(roles.map(exports.normalizeRole));
    if (req.user && blocked.has((0, exports.normalizeRole)(req.user.rol))) {
        return res.status(403).json({ error: 'Acceso denegado para este rol' });
    }
    next();
};
exports.forbidRoles = forbidRoles;
exports.authenticateToken = exports.requireAuth;
