import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || 'file:./dev.db' } } });

/**
 * CU-05: Ingresar insumos al inventario (desde compra)
 * Crea lotes en Inventario y registra movimientos en el Kardex.
 * Actualiza estado de la compra a INGRESADA.
 */
export const ingresarCompraInventario = async (req: Request, res: Response) => {
  const { compra_id, lotes } = req.body; // lotes: [{ insumo_id, cantidad, fecha_vencimiento, lote_code }]
  const usuario_id = (req as any).user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validar que la compra esté pendiente
      const compra = await tx.compra.findUnique({ 
        where: { id: compra_id },
        include: { detalles: true }
      });

      if (!compra || compra.estado !== 'PENDIENTE_INGRESO') {
        throw new Error('Compra no válida o ya ingresada');
      }

      // 2. Crear lotes y movimientos
      for (const lote of lotes) {
        const nuevoInventario = await tx.inventario.create({
          data: {
            insumo_id: lote.insumo_id,
            cantidad_actual: lote.cantidad,
            fecha_vencimiento: lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento) : null,
            lote: lote.lote_code,
            estado: 'Disponible'
          }
        });

        await tx.movimientoInventario.create({
          data: {
            insumo_id: lote.insumo_id,
            inventario_id: nuevoInventario.id,
            tipo_movimiento: 'Ingreso',
            cantidad: lote.cantidad,
            motivo: `INGRESO_COMPRA (Compra #${compra_id})`,
            usuario_id
          }
        });
      }

      // 3. Actualizar compra
      return tx.compra.update({
        where: { id: compra_id },
        data: { estado: 'INGRESADA' }
      });
    });

    res.json({ message: 'Inventario actualizado correctamente', compra: result });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al ingresar inventario' });
  }
};

/**
 * CU-07: Consultar inventario
 * Devuelve el stock disponible consolidado por insumo e incluye detalle de lotes.
 */
export const getInventario = async (req: Request, res: Response) => {
  try {
    const insumos = await prisma.insumo.findMany({
      where: { estado: 'Activo' },
      include: {
        inventarios: {
          where: { cantidad_actual: { gt: 0 }, estado: 'Disponible' },
          orderBy: { fecha_vencimiento: 'asc' }
        }
      }
    });

    // Calcular stock total para cada insumo para facilitar visualización
    const inventarioFormateado = insumos.map(insumo => ({
      ...insumo,
      stock_total: insumo.inventarios.reduce((acc, inv) => acc + inv.cantidad_actual, 0)
    }));

    res.json(inventarioFormateado);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar inventario' });
  }
};

/**
 * CU-08 / CU-09: Registrar producto vencido / dañado (Merma)
 */
export const registrarMerma = async (req: Request, res: Response) => {
  const { inventario_id, cantidad, motivo } = req.body; // motivo: Vencimiento o Daño
  const usuario_id = (req as any).user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const itemInventario = await tx.inventario.findUnique({ where: { id: inventario_id } });

      if (!itemInventario || itemInventario.cantidad_actual < cantidad) {
        throw new Error('Stock insuficiente en el lote seleccionado');
      }

      // 1. Descontar stock
      const updatedInventario = await tx.inventario.update({
        where: { id: inventario_id },
        data: { 
          cantidad_actual: itemInventario.cantidad_actual - cantidad,
          // Si el stock llega a 0 o es merma total, podríamos cambiar estado, 
          // pero aquí solo descontamos.
        }
      });

      // 2. Registrar movimiento de merma
      await tx.movimientoInventario.create({
        data: {
          insumo_id: itemInventario.insumo_id,
          inventario_id: itemInventario.id,
          tipo_movimiento: 'Merma',
          cantidad: cantidad,
          motivo: motivo, // Ej: "Vencido" o "Dañado"
          usuario_id
        }
      });

      return updatedInventario;
    });

    res.json({ message: 'Merma registrada con éxito', inventario: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al registrar merma' });
  }
};
