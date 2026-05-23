"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKardex = exports.getProducciones = void 0;
const prisma_1 = require("../../../core/api/prisma");
const canUseProduccion = (rol) => ['Gerente', 'Cocinero', 'Almacen', 'Almacén'].includes(rol || '');
const toIsoDate = (date) => date.toISOString().slice(0, 10);
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
