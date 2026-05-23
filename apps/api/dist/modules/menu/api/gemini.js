"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecipeStepsWithGemini = exports.suggestPlatoWithGemini = void 0;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const extractJson = (text) => {
    const cleaned = text.replace(/```json|```/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start)
        return null;
    try {
        return JSON.parse(cleaned.slice(start, end + 1));
    }
    catch {
        return null;
    }
};
const buildPrompt = (nombre, insumos, compact = false) => [
    'Eres chef de catering en Bolivia y asistente de planificación de recetas.',
    'Tu tarea es pensar una receta mínima por porción para el plato indicado.',
    'Usa solo insumos que existan en el catálogo. No inventes nombres ni IDs.',
    'Elige ingredientes razonables para cocina de catering, con cantidades operativas por una porción.',
    'Si falta un ingrediente ideal, usa el sustituto más cercano del catálogo o no lo incluyas.',
    compact ? 'Usa una descripción de máximo 80 caracteres.' : 'La descripción debe sonar natural y específica para el plato.',
    'No uses saltos de línea dentro de los valores de texto.',
    'Responde solo JSON válido, sin markdown, con esta forma exacta:',
    '{"descripcion":"texto breve","receta":[{"insumo_id":1,"cantidad_por_porcion":0.12,"unidad_medida":"Kg"}]}',
    `Plato: ${nombre}`,
    'Catálogo de insumos activos:',
    ...insumos.map(insumo => `ID ${insumo.id} | ${insumo.nombre} | unidad ${insumo.unidad_medida} | categoria ${insumo.categoria}`)
].join('\n');
const parseSuggestion = (rawText, insumos) => {
    const parsed = extractJson(rawText);
    if (!parsed || typeof parsed.descripcion !== 'string' || !Array.isArray(parsed.receta))
        return null;
    const insumoById = new Map(insumos.map(insumo => [insumo.id, insumo]));
    const used = new Set();
    const receta = [];
    for (const item of parsed.receta) {
        const insumoId = Number(item.insumo_id);
        const cantidad = Number(item.cantidad_por_porcion);
        const insumo = insumoById.get(insumoId);
        if (!insumo || used.has(insumoId) || !Number.isFinite(cantidad) || cantidad <= 0)
            continue;
        used.add(insumoId);
        receta.push({
            insumo_id: insumo.id,
            cantidad_por_porcion: Number(cantidad.toFixed(3)),
            unidad_medida: insumo.unidad_medida
        });
    }
    return {
        descripcion: parsed.descripcion.trim().slice(0, 180),
        receta: receta.slice(0, 10),
        fuente: 'gemini'
    };
};
const parseRecipeSteps = (rawText) => {
    const parsed = extractJson(rawText);
    if (!parsed || !Array.isArray(parsed.pasos))
        return null;
    const pasos = parsed.pasos
        .map((paso) => String(paso || '').trim())
        .filter(Boolean)
        .slice(0, 12);
    if (pasos.length === 0)
        return null;
    return {
        titulo: String(parsed.titulo || 'Receta paso a paso').trim().slice(0, 120),
        rendimiento: String(parsed.rendimiento || '1 porción base').trim().slice(0, 80),
        tiempo_estimado: String(parsed.tiempo_estimado || 'Tiempo variable').trim().slice(0, 80),
        pasos,
        tips: Array.isArray(parsed.tips)
            ? parsed.tips.map((tip) => String(tip || '').trim()).filter(Boolean).slice(0, 5)
            : [],
        fuente: 'gemini'
    };
};
const suggestPlatoWithGemini = async (nombre, insumos) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY no configurada');
    if (insumos.length === 0)
        throw new Error('No hay insumos activos para sugerir receta');
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const requestSuggestion = (prompt) => fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: {
                parts: [{ text: 'Devuelve solo JSON válido. Usa exclusivamente IDs del catálogo recibido.' }]
            },
            generationConfig: {
                temperature: 0.45,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            }
        })
    });
    for (const prompt of [buildPrompt(nombre, insumos), buildPrompt(nombre, insumos, true)]) {
        const response = await requestSuggestion(prompt);
        if (!response.ok) {
            console.error('Gemini sugerencia plato error:', response.status, await response.text());
            throw new Error('Gemini no pudo sugerir el plato');
        }
        const data = await response.json();
        const text = (data?.candidates?.[0]?.content?.parts || [])
            .map((part) => String(part?.text || ''))
            .join('');
        const suggestion = parseSuggestion(text, insumos);
        if (suggestion)
            return suggestion;
        console.error('Gemini sugerencia plato formato inválido:', text.slice(0, 300));
    }
    throw new Error('Gemini devolvió una sugerencia inválida');
};
exports.suggestPlatoWithGemini = suggestPlatoWithGemini;
const generateRecipeStepsWithGemini = async (input) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY no configurada');
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const ingredients = input.receta.map(item => `${item.insumo.nombre}: ${item.cantidad_por_porcion} ${item.unidad_medida} por porción`);
    const prompt = [
        'Eres chef operativo de catering en Bolivia.',
        'Genera una receta paso a paso clara, práctica y lista para cocina.',
        'Usa solo los ingredientes de la receta base recibida. Puedes mencionar agua, sal o cocción solo si ya están en la lista.',
        'No cambies cantidades. Explica preparación, orden de trabajo y punto de cocción.',
        'Responde solo JSON válido sin markdown con esta forma:',
        '{"titulo":"...","rendimiento":"1 porción base escalable","tiempo_estimado":"...","pasos":["..."],"tips":["..."]}',
        `Plato: ${input.nombre}`,
        `Descripción: ${input.descripcion || 'Sin descripción'}`,
        'Ingredientes:',
        ...ingredients
    ].join('\n');
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: {
                parts: [{ text: 'Devuelve solo JSON válido. La receta debe ser entendible para cocina de catering.' }]
            },
            generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            }
        })
    });
    if (!response.ok) {
        console.error('Gemini pasos receta error:', response.status, await response.text());
        throw new Error('Gemini no pudo generar la receta paso a paso');
    }
    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
        .map((part) => String(part?.text || ''))
        .join('');
    const parsed = parseRecipeSteps(text);
    if (!parsed) {
        console.error('Gemini pasos receta formato inválido:', text.slice(0, 300));
        throw new Error('Gemini devolvió una receta inválida');
    }
    return parsed;
};
exports.generateRecipeStepsWithGemini = generateRecipeStepsWithGemini;
