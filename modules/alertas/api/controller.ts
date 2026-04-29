import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || 'file:./dev.db' } } });

/**
 * CU-10 y CU-11: Generar Alertas
 */
export const getAlertas = async (req: Request, res: Response) => {
  const umbralDias = Number(req.query.dias) || 7;
  const hoy = startOfDay(new Date());
  const fechaLimite = addDays(hoy, umbralDias);

  try {
    // 1. Alertas por Bajo Stock (CU-11)
    // Obtenemos todos los insumos activos y calculamos su stock total actual
    const insumos = await prisma.insumo.findMany({
      where: { estado: 'Activo' },
      include: {
        inventarios: {
          where: { estado: 'Disponible' }
        }
      }
    });

    const alertasBajoStock = insumos
      .map(i => ({
        id: i.id,
        nombre: i.nombre,
        stock_minimo: i.stock_minimo,
        stock_actual: i.inventarios.reduce((acc, inv) => acc + inv.cantidad_actual, 0)
      }))
      .filter(i => i.stock_actual < i.stock_minimo);

    // 2. Alertas por Vencimiento (CU-10)
    const alertasVencimiento = await prisma.inventario.findMany({
      where: {
        estado: 'Disponible',
        cantidad_actual: { gt: 0 },
        fecha_vencimiento: {
          lte: fechaLimite,
          gte: hoy
        }
      },
      include: { insumo: { select: { nombre: true } } },
      orderBy: { fecha_vencimiento: 'asc' }
    });

    res.json({
      bajoStock: alertasBajoStock,
      vencimiento: alertasVencimiento,
      resumen: {
        totalBajoStock: alertasBajoStock.length,
        totalVencimiento: alertasVencimiento.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar alertas' });
  }
};
