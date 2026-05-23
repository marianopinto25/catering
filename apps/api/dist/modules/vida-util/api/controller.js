"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sugerirVidaUtil = void 0;
const prisma_1 = require("../../../core/api/prisma");
const gemini_1 = require("./gemini");
const CACHE_VARIANTS_LIMIT = 3;
const AI_REGENERATE_PROBABILITY = 0.3;
const toIsoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
const inferAmbiente = (date) => {
    const month = date.getMonth() + 1;
    if ([12, 1, 2, 3].includes(month))
        return 'caluroso o húmedo';
    if ([5, 6, 7, 8].includes(month))
        return 'frío o seco';
    return 'templado';
};
const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
const toEstimate = (cache) => ({
    vida_util_sugerida_dias: cache.vida_util_sugerida_dias,
    razon_corta: cache.razon_corta,
    explicacion: cache.explicacion,
    accion_sugerida: cache.accion_sugerida
});
const saveEstimateInCache = async (insumoId, ambiente, estimate, currentVariants) => {
    const data = {
        vida_util_sugerida_dias: estimate.vida_util_sugerida_dias,
        razon_corta: estimate.razon_corta,
        explicacion: estimate.explicacion,
        accion_sugerida: estimate.accion_sugerida
    };
    if (currentVariants.length < CACHE_VARIANTS_LIMIT) {
        const usedVariants = new Set(currentVariants.map(item => item.variante));
        const variante = [1, 2, 3].find(item => !usedVariants.has(item)) || currentVariants.length + 1;
        await prisma_1.prisma.vidaUtilIaCache.create({
            data: {
                insumo_id: insumoId,
                ambiente,
                variante,
                ...data
            }
        });
        return;
    }
    const variantToReplace = pickRandom(currentVariants);
    await prisma_1.prisma.vidaUtilIaCache.update({
        where: { id: variantToReplace.id },
        data
    });
};
const estimateWithCache = async (insumo, fechaRecepcion, condicionAmbiente) => {
    const cached = await prisma_1.prisma.vidaUtilIaCache.findMany({
        where: {
            insumo_id: insumo.id,
            ambiente: condicionAmbiente
        },
        orderBy: { updated_at: 'desc' }
    });
    const shouldUseCache = cached.length > 0 && Math.random() >= AI_REGENERATE_PROBABILITY;
    if (shouldUseCache) {
        const selected = pickRandom(cached);
        await prisma_1.prisma.vidaUtilIaCache.update({
            where: { id: selected.id },
            data: { usos: { increment: 1 } }
        });
        return toEstimate(selected);
    }
    const estimate = await (0, gemini_1.estimateWithGemini)({
        insumo: insumo.nombre,
        categoria: insumo.categoria,
        unidad_medida: insumo.unidad_medida,
        fecha_recepcion: toIsoDate(fechaRecepcion),
        condicion_ambiente: condicionAmbiente
    });
    await saveEstimateInCache(insumo.id, condicionAmbiente, estimate, cached);
    return estimate;
};
const sugerirVidaUtil = async (req, res) => {
    const insumoId = Number(req.query.insumo_id);
    const fechaRecepcionRaw = String(req.query.fecha_recepcion || '');
    if (!Number.isInteger(insumoId) || insumoId <= 0 || !fechaRecepcionRaw) {
        return res.status(400).json({ error: 'insumo_id y fecha_recepcion son obligatorios' });
    }
    const fechaRecepcion = new Date(`${fechaRecepcionRaw}T00:00:00`);
    if (Number.isNaN(fechaRecepcion.getTime())) {
        return res.status(400).json({ error: 'fecha_recepcion inválida' });
    }
    try {
        const condicionAmbiente = inferAmbiente(fechaRecepcion);
        const insumo = await prisma_1.prisma.insumo.findUnique({ where: { id: insumoId } });
        if (!insumo || insumo.estado !== 'Activo') {
            return res.status(404).json({ error: 'Insumo no encontrado o inactivo' });
        }
        const geminiEstimate = await estimateWithCache(insumo, fechaRecepcion, condicionAmbiente);
        return res.json({
            insumo_id: insumo.id,
            insumo: insumo.nombre,
            categoria: insumo.categoria,
            fecha_recepcion: toIsoDate(fechaRecepcion),
            ambiente_estimado: condicionAmbiente,
            vida_util_sugerida_dias: geminiEstimate.vida_util_sugerida_dias,
            fecha_vencimiento_sugerida: toIsoDate(addDays(fechaRecepcion, geminiEstimate.vida_util_sugerida_dias)),
            fuente: 'gemini',
            agente: {
                nombre: `Recomendación de vencimiento para ${insumo.nombre}`,
                estado: 'Agente IA activo',
                mensaje: `Leí el insumo "${insumo.nombre}" y estimé el vencimiento con ambiente ${condicionAmbiente}.`
            },
            editable: true,
            requiere_revision: false,
            razon_corta: geminiEstimate.razon_corta,
            explicacion: geminiEstimate.explicacion,
            accion_sugerida: geminiEstimate.accion_sugerida
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al sugerir vida útil' });
    }
};
exports.sugerirVidaUtil = sugerirVidaUtil;
