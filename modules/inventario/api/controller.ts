import { Request, Response } from 'express';
import { prisma } from '../../../core/api/prisma';

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
          orderBy: { fecha_vencimiento: 'asc' },
          include: {
            movimientos: {
              where: { tipo_movimiento: 'Ingreso' },
              orderBy: { fecha: 'asc' },
              take: 1
            }
          }
        }
      }
    });

    const compraIds = new Set<number>();
    for (const insumo of insumos) {
      for (const inventario of insumo.inventarios) {
        const motivo = inventario.movimientos[0]?.motivo || '';
        const fromMotivo = motivo.match(/Compra #(\d+)/i)?.[1];
        const fromLote = inventario.lote?.match(/^AUTO-(\d+)-/)?.[1];
        const compraId = Number(fromMotivo || fromLote);
        if (Number.isInteger(compraId) && compraId > 0) compraIds.add(compraId);
      }
    }

    const compras = await prisma.compra.findMany({
      where: { id: { in: Array.from(compraIds) } },
      include: { proveedor: { select: { razon_social: true } } }
    });
    const compraById = new Map(compras.map(compra => [compra.id, compra]));

    // Calcular stock total para cada insumo para facilitar visualización
    const inventarioFormateado = insumos.map(insumo => {
      const inventarios = insumo.inventarios.map((inventario) => {
        const motivo = inventario.movimientos[0]?.motivo || '';
        const fromMotivo = motivo.match(/Compra #(\d+)/i)?.[1];
        const fromLote = inventario.lote?.match(/^AUTO-(\d+)-/)?.[1];
        const compraId = Number(fromMotivo || fromLote);
        const compra = compraById.get(compraId);

        return {
          id: inventario.id,
          fecha_vencimiento: inventario.fecha_vencimiento,
          cantidad_actual: inventario.cantidad_actual,
          estado: inventario.estado,
          compra_id: Number.isInteger(compraId) && compraId > 0 ? compraId : null,
          fecha_compra: compra?.fecha || inventario.movimientos[0]?.fecha || null,
          proveedor_nombre: compra?.proveedor.razon_social || 'Proveedor no identificado'
        };
      });

      return {
        ...insumo,
        inventarios,
        stock_total: inventarios.reduce((acc, inv) => acc + inv.cantidad_actual, 0)
      };
    });

    res.json(inventarioFormateado);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar inventario' });
  }
};

/**
 * Sprint 3: resumen operativo de inventario.
 * Existencia = físico en almacén, En orden = compras pendientes, Solicitado = pedidos internos pendientes.
 */
export const getResumenInventario = async (req: Request, res: Response) => {
  try {
    const insumos = await prisma.insumo.findMany({
      where: { estado: 'Activo' },
      orderBy: { nombre: 'asc' },
      include: {
        inventarios: {
          where: { cantidad_actual: { gt: 0 }, estado: 'Disponible' }
        },
        compras_det: {
          where: { compra: { estado: 'PENDIENTE_INGRESO' } },
          select: { cantidad: true }
        },
        solicitudes: {
          where: { estado: 'PENDIENTE' },
          select: { cantidad: true }
        }
      }
    });

    const resumen = insumos.map((insumo) => ({
      insumo_id: insumo.id,
      nombre: insumo.nombre,
      marca: insumo.marca,
      unidad_medida: insumo.unidad_medida,
      categoria: insumo.categoria,
      stock_minimo: insumo.stock_minimo,
      onHand: insumo.inventarios.reduce((acc, inv) => acc + inv.cantidad_actual, 0),
      onOrder: insumo.compras_det.reduce((acc, det) => acc + det.cantidad, 0),
      requested: insumo.solicitudes.reduce((acc, solicitud) => acc + solicitud.cantidad, 0)
    }));

    res.json(resumen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar resumen de inventario' });
  }
};

/**
 * CU-08 / CU-09: Registrar ajuste por producto vencido / dañado.
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

      // 2. Registrar movimiento de ajuste
      await tx.movimientoInventario.create({
        data: {
          insumo_id: itemInventario.insumo_id,
          inventario_id: itemInventario.id,
          tipo_movimiento: 'Ajuste',
          cantidad: cantidad,
          motivo: motivo, // Ej: "Vencido" o "Dañado"
          usuario_id
        }
      });

      return updatedInventario;
    });

    res.json({ message: 'Ajuste registrado con éxito', inventario: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al registrar ajuste' });
  }
};
