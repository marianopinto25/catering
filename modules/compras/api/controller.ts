import { Request, Response } from 'express';
import { prisma } from '../../../core/api/prisma';

const DEFAULT_VIDA_UTIL_DIAS = 7;

/**
 * CU-04: Registrar compra de insumos
 * Solo registra la Compra y su detalle. Estado: PENDIENTE_INGRESO.
 * No afecta inventario aún.
 */
export const registrarCompra = async (req: Request, res: Response) => {
  const { proveedor_id, fecha, total, detalles } = req.body;

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
        fecha: fecha ? new Date(fecha) : undefined,
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

export const getSugerenciaCompra = async (req: Request, res: Response) => {
  const anio = Number(req.query.anio);
  const mes = Number(req.query.mes);
  const semana = Number(req.query.semana);

  if (!anio || !mes || !Number.isInteger(semana) || semana < 1 || semana > 4) {
    return res.status(400).json({ error: 'Debe enviar anio, mes y semana válida (1-4)' });
  }

  try {
    const menu = await prisma.menuMes.findUnique({
      where: { anio_mes: { anio, mes } },
      include: {
        items: {
          where: { semana },
          include: {
            plato: {
              include: {
                receta: {
                  include: { insumo: true }
                }
              }
            }
          },
          orderBy: [{ dia: 'asc' }, { turno: 'asc' }]
        }
      }
    });

    if (!menu) {
      return res.json({ anio, mes, semana, menu: null, items: [] });
    }

    const requeridos = new Map<number, {
      insumo_id: number;
      nombre: string;
      unidad: string;
      requerido: number;
      diasServicio: Set<string>;
    }>();

    for (const item of menu.items) {
      for (const receta of item.plato.receta) {
        const actual = requeridos.get(receta.insumo_id) || {
          insumo_id: receta.insumo_id,
          nombre: receta.insumo.nombre,
          unidad: receta.unidad_medida,
          requerido: 0,
          diasServicio: new Set<string>()
        };

        actual.requerido += receta.cantidad_por_porcion * item.porciones_estimadas;
        actual.diasServicio.add(item.dia);
        requeridos.set(receta.insumo_id, actual);
      }
    }

    const items = await Promise.all(Array.from(requeridos.values()).map(async (reqItem) => {
      const [inventarios, comprasPendientes] = await Promise.all([
        prisma.inventario.findMany({
          where: {
            insumo_id: reqItem.insumo_id,
            estado: 'Disponible',
            cantidad_actual: { gt: 0 }
          },
          select: { cantidad_actual: true }
        }),
        prisma.compraDetalle.findMany({
          where: {
            insumo_id: reqItem.insumo_id,
            compra: { estado: 'PENDIENTE_INGRESO' }
          },
          select: { cantidad: true }
        })
      ]);

      const existencia = inventarios.reduce((acc, item) => acc + item.cantidad_actual, 0);
      const enOrden = comprasPendientes.reduce((acc, item) => acc + item.cantidad, 0);
      const diasServicio = Math.max(reqItem.diasServicio.size, 1);
      const vida_util_dias = DEFAULT_VIDA_UTIL_DIAS;
      const consumoDiarioEstimado = reqItem.requerido / diasServicio;
      const limite_perecible = consumoDiarioEstimado * vida_util_dias;
      const sugeridoBase = Math.max(0, reqItem.requerido - (existencia + enOrden));
      const sugerido = Math.min(sugeridoBase, limite_perecible);

      return {
        insumo_id: reqItem.insumo_id,
        nombre: reqItem.nombre,
        unidad: reqItem.unidad,
        requerido: Number(reqItem.requerido.toFixed(2)),
        existencia: Number(existencia.toFixed(2)),
        enOrden: Number(enOrden.toFixed(2)),
        sugerido: Number(sugerido.toFixed(2)),
        vida_util_dias,
        limite_perecible: Number(limite_perecible.toFixed(2))
      };
    }));

    res.json({
      anio,
      mes,
      semana,
      menu: {
        id: menu.id,
        estado: menu.estado,
        items: menu.items.map(item => ({
          id: item.id,
          dia: item.dia,
          turno: item.turno,
          porciones_estimadas: item.porciones_estimadas,
          plato: { id: item.plato.id, nombre: item.plato.nombre }
        }))
      },
      items: items.sort((a, b) => a.nombre.localeCompare(b.nombre))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular sugerencia de compra' });
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
