import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../core/api/prisma';
import { authenticateToken, AuthRequest } from '../../../core/api/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-mock';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    // Mock autenticación básica
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, nombre: true, rol: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
