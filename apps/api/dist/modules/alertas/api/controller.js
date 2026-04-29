"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlertas = void 0;
const prisma_1 = require("../../../core/api/prisma");
const date_fns_1 = require("date-fns");
/**
 * CU-10 y CU-11: Generar Alertas
 */
const getAlertas = async (req, res) => {
    const umbralDias = Number(req.query.dias) || 7;
    const hoy = (0, date_fns_1.startOfDay)(new Date());
    const fechaLimite = (0, date_fns_1.addDays)(hoy, umbralDias);
    try {
        // 1. Alertas por Bajo Stock (CU-11)
        // Obtenemos todos los insumos activos y calculamos su stock total actual
        const insumos = await prisma_1.prisma.insumo.findMany({
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
        const alertasVencimiento = await prisma_1.prisma.inventario.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar alertas' });
    }
};
exports.getAlertas = getAlertas;
