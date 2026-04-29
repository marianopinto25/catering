import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || 'file:./dev.db' } } });

/**
 * CU-04: Registrar compra de insumos
 * Solo registra la Compra y su detalle. Estado: PENDIENTE_INGRESO.
 * No afecta inventario aún.
 */
export const registrarCompra = async (req: Request, res: Response) => {
  const { proveedor_id, total, detalles } = req.body;

  try {
    // Validar proveedor
    const proveedor = await prisma.proveedor.findUnique({ where: { id: proveedor_id } });
    if (!proveedor || proveedor.estado !== 'Activo') {
      return res.status(400).json({ error: 'Proveedor no válido o inactivo' });
    }

    // Crear compra con detalles en una transacción
    const compra = await prisma.compra.create({
      data: {
        proveedor_id,
        total,
        estado: 'PENDIENTE_INGRESO',
        detalles: {
          create: detalles.map((d: any) => ({
            insumo_id: d.insumo_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          })),
        },
      },
      include: { detalles: true },
    });

    res.status(201).json(compra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar la compra' });
  }
};

export const getCompras = async (req: Request, res: Response) => {
  try {
    const compras = await prisma.compra.findMany({
      include: { proveedor: { select: { razon_social: true } } },
      orderBy: { fecha: 'desc' },
    });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

export const getCompraById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const compra = await prisma.compra.findUnique({
      where: { id: Number(id) },
      include: { 
        detalles: { include: { insumo: true } },
        proveedor: true 
      },
    });
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(compra);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalle de compra' });
  }
};
