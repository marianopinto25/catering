"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../../core/api/prisma");
const auth_middleware_1 = require("../../../core/api/auth.middleware");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-mock';
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.prisma.usuario.findUnique({
            where: { email },
        });
        // Mock autenticación básica
        if (!user || user.password_hash !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, rol: user.rol, nombre: user.nombre }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
    }
    catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});
router.get('/me', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const user = await prisma_1.prisma.usuario.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, nombre: true, rol: true }
        });
        if (!user)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ user });
    }
    catch {
        res.status(500).json({ error: 'Error del servidor' });
    }
});
exports.default = router;
