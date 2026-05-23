import { Request, Response } from 'express';
import { prisma } from '../../../core/api/prisma';
import { GeminiEstimate, estimateWithGemini } from './gemini';

const CACHE_VARIANTS_LIMIT = 3;
const AI_REGENERATE_PROBABILITY = 0.3;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const inferAmbiente = (date: Date) => {
  const month = date.getMonth() + 1;
  if ([12, 1, 2, 3].includes(month)) return 'caluroso o húmedo';
  if ([5, 6, 7, 8].includes(month)) return 'frío o seco';
  return 'templado';
};

const pickRandom = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const toEstimate = (cache: {
  vida_util_sugerida_dias: number;
  razon_corta: string;
  explicacion: string;
  accion_sugerida: string;
}): GeminiEstimate => ({
  vida_util_sugerida_dias: cache.vida_util_sugerida_dias,
  razon_corta: cache.razon_corta,
  explicacion: cache.explicacion,
  accion_sugerida: cache.accion_sugerida,
  fuente: 'cache'
});

const saveEstimateInCache = async (
  insumoId: number,
  ambiente: string,
  estimate: GeminiEstimate,
  currentVariants: { id: number; variante: number }[]
) => {
  const data = {
    vida_util_sugerida_dias: estimate.vida_util_sugerida_dias,
    razon_corta: estimate.razon_corta,
    explicacion: estimate.explicacion,
    accion_sugerida: estimate.accion_sugerida
  };

  if (currentVariants.length < CACHE_VARIANTS_LIMIT) {
    const usedVariants = new Set(currentVariants.map(item => item.variante));
    const variante = [1, 2, 3].find(item => !usedVariants.has(item)) || currentVariants.length + 1;
    await prisma.vidaUtilIaCache.create({
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
  await prisma.vidaUtilIaCache.update({
    where: { id: variantToReplace.id },
    data
  });
};

const estimateWithCache = async (
  insumo: { id: number; nombre: string; categoria: string; unidad_medida: string },
  fechaRecepcion: Date,
  condicionAmbiente: string
) => {
  const cached = await prisma.vidaUtilIaCache.findMany({
    where: {
      insumo_id: insumo.id,
      ambiente: condicionAmbiente
    },
    orderBy: { updated_at: 'desc' }
  });

  const shouldUseCache = cached.length > 0 && Math.random() >= AI_REGENERATE_PROBABILITY;
  if (shouldUseCache) {
    const selected = pickRandom(cached);
    await prisma.vidaUtilIaCache.update({
      where: { id: selected.id },
      data: { usos: { increment: 1 } }
    });
    return toEstimate(selected);
  }

  const estimate = await estimateWithGemini({
    insumo: insumo.nombre,
    categoria: insumo.categoria,
    unidad_medida: insumo.unidad_medida,
    fecha_recepcion: toIsoDate(fechaRecepcion),
    condicion_ambiente: condicionAmbiente
  });

  await saveEstimateInCache(insumo.id, condicionAmbiente, estimate, cached);
  return estimate;
};

export const sugerirVidaUtil = async (req: Request, res: Response) => {
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

    const insumo = await prisma.insumo.findUnique({ where: { id: insumoId } });
    if (!insumo || insumo.estado !== 'Activo') {
      return res.status(404).json({ error: 'Insumo no encontrado o inactivo' });
    }

    const geminiEstimate = await estimateWithCache(insumo, fechaRecepcion, condicionAmbiente);
    const isGemini = geminiEstimate.fuente === 'gemini';
    const isCache = geminiEstimate.fuente === 'cache';

    return res.json({
      insumo_id: insumo.id,
      insumo: insumo.nombre,
      categoria: insumo.categoria,
      fecha_recepcion: toIsoDate(fechaRecepcion),
      ambiente_estimado: condicionAmbiente,
      vida_util_sugerida_dias: geminiEstimate.vida_util_sugerida_dias,
      fecha_vencimiento_sugerida: toIsoDate(addDays(fechaRecepcion, geminiEstimate.vida_util_sugerida_dias)),
      fuente: geminiEstimate.fuente,
      agente: {
        nombre: `Recomendación de vencimiento para ${insumo.nombre}`,
        estado: isGemini ? 'Agente IA activo' : isCache ? 'Estimación guardada' : 'Estimación automática',
        mensaje: isGemini
          ? `Leí el insumo "${insumo.nombre}" y estimé el vencimiento con ambiente ${condicionAmbiente}.`
          : isCache
            ? `Usé una recomendación guardada para ${insumo.nombre}.`
          : `Gemini no está disponible; usé una regla local para ${insumo.nombre}.`
      },
      editable: true,
      requiere_revision: false,
      razon_corta: geminiEstimate.razon_corta,
      explicacion: geminiEstimate.explicacion,
      accion_sugerida: geminiEstimate.accion_sugerida
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al sugerir vida útil' });
  }
};
