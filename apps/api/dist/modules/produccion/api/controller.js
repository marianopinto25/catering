"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKardex = exports.getProducciones = exports.registrarProduccion = void 0;
const prisma_1 = require("../../../core/api/prisma");
const canUseProduccion = (rol) => ['Gerente', 'Cocinero', 'Almacen', 'Almacén'].includes(rol || '');
const TURNOS = ['Desayuno', 'Almuerzo', 'Cena'];
const toIsoDate = (date) => date.toISOString().slice(0, 10);
const roundQty = (value) => Number(value.toFixed(4));
const parseFecha = (raw) => {
    const value = String(raw || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};
const registrarProduccion = async (req, res) => {
    if (!canUseProduccion(req.user?.rol))
        return res.status(403).json({ error: 'Acceso denegado' });
    const platoId = Number(req.body.plato_id);
    const porciones = Number(req.body.porciones);
    const fecha = parseFecha(req.body.fecha);
    const turno = String(req.body.turno || '').trim();
    const observacion = String(req.body.observacion || '').trim();
    try {
        if (!Number.isInteger(platoId) || platoId <= 0 || !Number.isInteger(porciones) || porciones <= 0 || !fecha) {
            return res.status(400).json({ error: 'plato_id, porciones y fecha son obligatorios' });
        }
        if (turno && !TURNOS.includes(turno))
            return res.status(400).json({ error: 'Turno inválido' });
        const plato = await prisma_1.prisma.plato.findUnique({
            where: { id: platoId },
            include: {
                receta: {
                    include: { insumo: true },
                    orderBy: { insumo: { nombre: 'asc' } }
                }
            }
        });
        if (!plato || plato.estado !== 'Activo')
            return res.status(404).json({ error: 'Plato no encontrado o inactivo' });
        if (plato.receta.length === 0)
            return res.status(400).json({ error: 'El plato no tiene receta cargada' });
        const requerimientos = plato.receta.map(item => ({
            plato_insumo_id: item.id,
            insumo_id: item.insumo_id,
            nombre: item.insumo.nombre,
            unidad_medida: item.unidad_medida,
            requerido: roundQty(item.cantidad_por_porcion * porciones)
        }));
        const lotesPorInsumo = new Map();
        const faltantes = [];
        for (const reqItem of requerimientos) {
            const lotes = await prisma_1.prisma.inventario.findMany({
                where: {
                    insumo_id: reqItem.insumo_id,
                    estado: 'Disponible',
                    cantidad_actual: { gt: 0 }
                },
                orderBy: [
                    { fecha_vencimiento: 'asc' },
                    { id: 'asc' }
                ]
            });
            lotesPorInsumo.set(reqItem.insumo_id, lotes);
            const disponible = roundQty(lotes.reduce((acc, lote) => acc + lote.cantidad_actual, 0));
            if (disponible < reqItem.requerido) {
                faltantes.push({
                    insumo_id: reqItem.insumo_id,
                    nombre: reqItem.nombre,
                    unidad_medida: reqItem.unidad_medida,
                    requerido: reqItem.requerido,
                    disponible,
                    faltante: roundQty(reqItem.requerido - disponible)
                });
            }
        }
        if (faltantes.length > 0) {
            return res.status(409).json({
                error: 'Stock insuficiente para registrar producción',
                faltantes
            });
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const produccion = await tx.produccion.create({
                data: {
                    plato_id: platoId,
                    porciones,
                    fecha,
                    turno: turno || null,
                    observacion: observacion || null,
                    producido_por_id: req.user.id
                }
            });
            for (const reqItem of requerimientos) {
                let restante = reqItem.requerido;
                const lotes = lotesPorInsumo.get(reqItem.insumo_id) || [];
                for (const lote of lotes) {
                    if (restante <= 0)
                        break;
                    const cantidadSalida = roundQty(Math.min(lote.cantidad_actual, restante));
                    if (cantidadSalida <= 0)
                        continue;
                    await tx.inventario.update({
                        where: { id: lote.id },
                        data: { cantidad_actual: roundQty(lote.cantidad_actual - cantidadSalida) }
                    });
                    const detalle = await tx.produccionDetalle.create({
                        data: {
                            produccion_id: produccion.id,
                            plato_insumo_id: reqItem.plato_insumo_id,
                            insumo_id: reqItem.insumo_id,
                            inventario_id: lote.id,
                            cantidad: cantidadSalida,
                            unidad_medida: reqItem.unidad_medida,
                            lote_snapshot: lote.lote,
                            fecha_vencimiento_snapshot: lote.fecha_vencimiento
                        }
                    });
                    await tx.movimientoInventario.create({
                        data: {
                            insumo_id: reqItem.insumo_id,
                            inventario_id: lote.id,
                            tipo_movimiento: 'Salida',
                            cantidad: cantidadSalida,
                            motivo: `PRODUCCION_FEFO (Producción #${produccion.id}, ${plato.nombre}, ${porciones} porciones)`,
                            usuario_id: req.user.id,
                            produccion_detalle_id: detalle.id
                        }
                    });
                    restante = roundQty(restante - cantidadSalida);
                }
            }
            return tx.produccion.findUnique({
                where: { id: produccion.id },
                include: {
                    plato: true,
                    producido_por: { select: { id: true, nombre: true, rol: true } },
                    detalles: {
                        include: {
                            insumo: true,
                            inventario: true
                        },
                        orderBy: [{ insumo: { nombre: 'asc' } }, { fecha_vencimiento_snapshot: 'asc' }]
                    }
                }
            });
        });
        res.status(201).json(result ? { ...result, fecha: toIsoDate(result.fecha) } : result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar producción' });
    }
};
exports.registrarProduccion = registrarProduccion;
const getProducciones = async (req, res) => {
    if (!canUseProduccion(req.user?.rol))
        return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const producciones = await prisma_1.prisma.produccion.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener producciones' });
    }
};
exports.getProducciones = getProducciones;
const getKardex = async (req, res) => {
    if (!canUseProduccion(req.user?.rol))
        return res.status(403).json({ error: 'Acceso denegado' });
    const insumoId = Number(req.query.insumo_id);
    try {
        const movimientos = await prisma_1.prisma.movimientoInventario.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener Kardex' });
    }
};
exports.getKardex = getKardex;
