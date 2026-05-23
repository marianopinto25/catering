import { Response } from 'express';
import { prisma } from '../../../core/api/prisma';
import { AuthRequest } from '../../../core/api/auth.middleware';

const canUseProduccion = (rol?: string) => ['Gerente', 'Cocinero', 'Almacen', 'Almacén'].includes(rol || '');

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const getProducciones = async (req: AuthRequest, res: Response) => {
  if (!canUseProduccion(req.user?.rol)) return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const producciones = await prisma.produccion.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        plato: true,
        producido_por: { select: { id: true, nombre: true, rol: true } },
        detalles: {
          include: {
            insumo: true,
            inventario: true
          }
        }
      }
    });

    res.json(producciones.map(produccion => ({
      ...produccion,
      fecha: toIsoDate(produccion.fecha)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producciones' });
  }
};

export const getKardex = async (req: AuthRequest, res: Response) => {
  if (!canUseProduccion(req.user?.rol)) return res.status(403).json({ error: 'Acceso denegado' });

  const insumoId = Number(req.query.insumo_id);

  try {
    const movimientos = await prisma.movimientoInventario.findMany({
      where: Number.isInteger(insumoId) && insumoId > 0 ? { insumo_id: insumoId } : {},
      orderBy: { fecha: 'desc' },
      take: 200,
      include: {
        insumo: true,
        inventario: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        produccion_detalle: {
          include: {
            produccion: { include: { plato: true } }
          }
        }
      }
    });

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener Kardex' });
  }
};
