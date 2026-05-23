import { Request, Response } from 'express';
import { prisma } from '../../../core/api/prisma';
import { explainPurchaseSuggestionWithGemini } from './gemini';

const DEFAULT_VIDA_UTIL_DIAS = 7;

const parsePositiveNumber = (value: unknown) => Number(value);
const validateMes = (mes: number) => Number.isInteger(mes) && mes >= 1 && mes <= 12;
const validateSemana = (semana: number) => Number.isInteger(semana) && semana >= 1 && semana <= 4;

const getProveedorInsumoMap = async (insumoIds: number[], proveedorId?: number) => {
  const relaciones = await prisma.proveedorInsumo.findMany({
    where: {
      insumo_id: { in: insumoIds },
      estado: 'Activo',
      ...(proveedorId ? { proveedor_id: proveedorId } : { es_preferido: true })
    },
    include: { proveedor: { select: { id: true, razon_social: true } } }
  });

  return new Map(relaciones.map(rel => [rel.insumo_id, rel]));
};

/**
 * CU-04: Registrar compra de insumos
 * Solo registra la Compra y su detalle. Estado: PENDIENTE_INGRESO.
 * No afecta inventario aún.
 */
export const registrarCompra = async (req: Request, res: Response) => {
  const { proveedor_id, fecha, detalles } = req.body;

  try {
    // Validar proveedor
    const proveedor = await prisma.proveedor.findUnique({ where: { id: proveedor_id } });
    if (!proveedor || proveedor.estado !== 'Activo') {
      return res.status(400).json({ error: 'Proveedor no válido o inactivo' });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: 'Agregue al menos un insumo' });
    }

    const insumoIds = detalles.map((d: any) => Number(d.insumo_id));
    const proveedorInsumoById = await getProveedorInsumoMap(insumoIds, Number(proveedor_id));

    const detallesSeguros = detalles.map((d: any) => {
      const insumoId = Number(d.insumo_id);
      const cantidad = Number(d.cantidad);
      const proveedorInsumo = proveedorInsumoById.get(insumoId);
      if (!proveedorInsumo) throw new Error('Hay insumos que este proveedor no tiene configurados');
      if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error('Todas las cantidades deben ser mayores a 0');
      if (!Number.isFinite(proveedorInsumo.precio_unitario) || proveedorInsumo.precio_unitario <= 0) {
        throw new Error('Defina precio unitario proveedor-insumo antes de comprar');
      }
      return {
        insumo_id: insumoId,
        cantidad,
        precio_unitario: proveedorInsumo.precio_unitario
      };
    });

    const totalSeguro = detallesSeguros.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);

    // Crear compra con detalles en una transacción
    const compra = await prisma.compra.create({
      data: {
        proveedor_id,
        fecha: fecha ? new Date(fecha) : undefined,
        total: Number(totalSeguro.toFixed(2)),
        estado: 'PENDIENTE_INGRESO',
        detalles: {
          create: detallesSeguros,
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

export const generarComprasDesdeSugerencia = async (req: Request, res: Response) => {
  const { fecha, detalles } = req.body;

  try {
    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: 'Agregue al menos un insumo' });
    }

    const insumoIds = detalles.map((d: any) => Number(d.insumo_id));
    const relaciones = await prisma.proveedorInsumo.findMany({
      where: {
        insumo_id: { in: insumoIds },
        estado: 'Activo'
      },
      include: { proveedor: { select: { id: true, razon_social: true } } }
    });
    const relacionByInsumoProveedor = new Map(relaciones.map(rel => [`${rel.insumo_id}:${rel.proveedor_id}`, rel]));
    const preferidaByInsumo = new Map<number, (typeof relaciones)[number]>();
    for (const rel of relaciones) {
      const current = preferidaByInsumo.get(rel.insumo_id);
      if (!current || rel.es_preferido || (!current.es_preferido && rel.precio_unitario < current.precio_unitario)) {
        preferidaByInsumo.set(rel.insumo_id, rel);
      }
    }

    const agrupado = new Map<number, Array<{ insumo_id: number; cantidad: number; precio_unitario: number }>>();

    for (const detalle of detalles) {
      const insumoId = Number(detalle.insumo_id);
      const cantidad = Number(detalle.cantidad);
      const proveedorId = detalle.proveedor_id ? Number(detalle.proveedor_id) : null;
      const proveedorInsumo = proveedorId
        ? relacionByInsumoProveedor.get(`${insumoId}:${proveedorId}`)
        : preferidaByInsumo.get(insumoId);

      if (!proveedorInsumo) throw new Error('Hay insumos sin proveedor válido configurado');
      if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error('Todas las cantidades deben ser mayores a 0');
      if (!Number.isFinite(proveedorInsumo.precio_unitario) || proveedorInsumo.precio_unitario <= 0) {
        throw new Error('Hay insumos sin precio válido con el proveedor seleccionado');
      }

      const items = agrupado.get(proveedorInsumo.proveedor_id) || [];
      items.push({
        insumo_id: insumoId,
        cantidad,
        precio_unitario: proveedorInsumo.precio_unitario
      });
      agrupado.set(proveedorInsumo.proveedor_id, items);
    }

    const compras = await prisma.$transaction(async (tx) => {
      const creadas = [];
      for (const [proveedor_id, items] of agrupado.entries()) {
        const total = items.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);
        const compra = await tx.compra.create({
          data: {
            proveedor_id,
            fecha: fecha ? new Date(fecha) : undefined,
            total: Number(total.toFixed(2)),
            estado: 'PENDIENTE_INGRESO',
            detalles: { create: items }
          },
          include: { proveedor: true, detalles: { include: { insumo: true } } }
        });
        creadas.push(compra);
      }
      return creadas;
    });

    res.status(201).json({ message: 'Compras generadas por proveedor', compras });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al generar compras por proveedor' });
  }
};

export const getCompras = async (req: Request, res: Response) => {
  try {
    const compras = await prisma.compra.findMany({
      include: {
        proveedor: { select: { razon_social: true } },
        detalles: {
          include: { insumo: true },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { fecha: 'desc' },
    });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

export const getSugerenciaCompra = async (req: Request, res: Response) => {
  const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear();
  const mes = Number(req.query.mes);
  const semana = Number(req.query.semana);

  if (!Number.isInteger(anio) || !validateMes(mes) || !validateSemana(semana)) {
    return res.status(400).json({ error: 'Parámetros inválidos: mes debe ser 1-12 y semana 1-4' });
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
      return res.status(404).json({ error: 'No existe menú para el mes y año seleccionados' });
    }

    const requeridos = new Map<number, {
      insumo_id: number;
      nombre: string;
      unidad: string;
      requerido: number;
      diasServicio: Set<string>;
      inconsistenciasUnidad: string[];
      usadoEn: Set<string>;
    }>();

    for (const item of menu.items) {
      for (const receta of item.plato.receta) {
        const requeridoReceta = parsePositiveNumber(receta.cantidad_por_porcion) * item.porciones_estimadas;
        const actual = requeridos.get(receta.insumo_id) || {
          insumo_id: receta.insumo_id,
          nombre: receta.insumo.nombre,
          unidad: receta.unidad_medida,
          requerido: 0,
          diasServicio: new Set<string>(),
          inconsistenciasUnidad: [],
          usadoEn: new Set<string>()
        };

        if (actual.unidad !== receta.unidad_medida && !actual.inconsistenciasUnidad.includes(receta.unidad_medida)) {
          actual.inconsistenciasUnidad.push(receta.unidad_medida);
        }

        actual.requerido += requeridoReceta;
        actual.diasServicio.add(item.dia);
        actual.usadoEn.add(`${item.dia} ${item.turno}: ${item.plato.nombre}`);
        requeridos.set(receta.insumo_id, actual);
      }
    }

    const inconsistencias = Array.from(requeridos.values())
      .filter(item => item.inconsistenciasUnidad.length > 0)
      .map(item => ({
        insumo_id: item.insumo_id,
        nombre: item.nombre,
        unidades: [item.unidad, ...item.inconsistenciasUnidad]
      }));

    if (inconsistencias.length > 0) {
      return res.status(400).json({
        error: 'Hay recetas con unidades distintas para el mismo insumo. Corrija la receta antes de calcular la sugerencia.',
        inconsistencias
      });
    }

    const itemsBase = await Promise.all(Array.from(requeridos.values()).map(async (reqItem) => {
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
      const proveedorInsumo = await prisma.proveedorInsumo.findFirst({
        where: { insumo_id: reqItem.insumo_id, estado: 'Activo', es_preferido: true },
        include: { proveedor: { select: { id: true, razon_social: true } } }
      });

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
        limite_perecible: Number(limite_perecible.toFixed(2)),
        diasServicio,
        usado_en: Array.from(reqItem.usadoEn),
        proveedor_id: proveedorInsumo?.proveedor.id || null,
        proveedor_nombre: proveedorInsumo?.proveedor.razon_social || 'Sin proveedor preferido',
        precio_unitario: proveedorInsumo?.precio_unitario || 0
      };
    }));

    const aiReasons = await explainPurchaseSuggestionWithGemini(itemsBase, { anio, mes, semana });
    const items = itemsBase.map(item => {
      const faltante = Math.max(0, item.requerido - (item.existencia + item.enOrden));
      const fallbackReason = item.sugerido > 0
        ? `Para el menú semana ${semana} se requieren ${item.requerido} ${item.unidad}; hay ${item.existencia} en inventario y ${item.enOrden} en compras pendientes. Falta comprar ${item.sugerido} ${item.unidad}.`
        : `No se sugiere comprar: el requerido (${item.requerido} ${item.unidad}) queda cubierto por inventario (${item.existencia}) y compras pendientes (${item.enOrden}).`;

      return {
        ...item,
        faltante: Number(faltante.toFixed(2)),
        criterio: 'Requerido del menú - (existencia en inventario + compras pendientes de ingreso)',
        razon_sugerencia: aiReasons.get(item.insumo_id) || fallbackReason
      };
    });

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
