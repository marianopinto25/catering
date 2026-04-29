import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-mock';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; rol: string; nombre: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireGerente = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.rol !== 'Gerente') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
  }
  next();
};

export const authenticateToken = requireAuth;
