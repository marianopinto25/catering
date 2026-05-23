interface GeminiEstimateInput {
  insumo: string;
  categoria: string;
  unidad_medida: string;
  fecha_recepcion: string;
  condicion_ambiente: string;
}

export interface GeminiEstimate {
  vida_util_sugerida_dias: number;
  razon_corta: string;
  explicacion: string;
  accion_sugerida: string;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const clampDays = (days: number) => Math.min(Math.max(Math.round(days), 1), 120);

const fallbackEstimate = (input: GeminiEstimateInput): GeminiEstimate => {
  const text = `${input.insumo} ${input.categoria}`.toLowerCase();
  const ambiente = input.condicion_ambiente.toLowerCase();
  const isHot = ambiente.includes('caluroso') || ambiente.includes('húmedo') || ambiente.includes('humedo');
  const isCold = ambiente.includes('frío') || ambiente.includes('frio') || ambiente.includes('seco');

  let baseDays = 14;
  let tipo = 'producto estable';
  let cuidado = 'Mantener cerrado, limpio y lejos de sol directo.';

  if (/pollo|carne|res|pescado|cerdo|at[uú]n|huevo/.test(text)) {
    baseDays = /huevo/.test(text) ? 21 : 2;
    tipo = 'proteína sensible';
    cuidado = 'Mantener refrigerado y revisar olor, color y textura antes de usar.';
  } else if (/leche|yogurt|queso|láct|lact/.test(text)) {
    baseDays = /queso/.test(text) ? 10 : 5;
    tipo = 'lácteo refrigerado';
    cuidado = 'Mantener cadena de frío y cerrar bien el envase.';
  } else if (/banana|plátano|platano|lechuga|tomate|fruta|verdura|papa|cebolla|zanahoria|zapallo/.test(text)) {
    baseDays = /banana|plátano|platano|lechuga/.test(text) ? 4 : 7;
    tipo = 'producto fresco';
    cuidado = 'Separar piezas golpeadas y almacenar ventilado para evitar maduración rápida o moho.';
  } else if (/pan/.test(text)) {
    baseDays = 3;
    tipo = 'panificado';
    cuidado = 'Guardar seco y tapado; revisar humedad y moho.';
  } else if (/agua|aceite|azúcar|azucar|arroz|fideo|harina|té|te|café|cafe|avena|granola|mermelada|condimento|ajinomoto/.test(text)) {
    baseDays = /agua|aceite/.test(text) ? 90 : 60;
    tipo = 'insumo seco o envasado';
    cuidado = 'Conservar en envase cerrado, sin humedad y lejos de calor.';
  }

  const adjustedDays = isHot
    ? Math.max(1, Math.round(baseDays * 0.75))
    : isCold
      ? Math.round(baseDays * 1.15)
      : baseDays;

  const razon = `${input.insumo}: ${tipo}; ambiente ${input.condicion_ambiente}.`;
  return {
    vida_util_sugerida_dias: clampDays(adjustedDays),
    razon_corta: razon,
    explicacion: isHot
      ? `${razon} Con calor o humedad se acelera el deterioro, por eso se acorta la fecha sugerida.`
      : isCold
        ? `${razon} Con ambiente frío o seco se conserva un poco mejor si se almacena correctamente.`
        : `${razon} Se usa una estimación operativa para cocina y almacén.`,
    accion_sugerida: cuidado
  };
};

const extractField = (text: string, label: string) => {
  const pattern = new RegExp(`${label}\\s*:?\\s*([\\s\\S]*?)(?=\\n(?:DIAS|RAZON|DETALLE|ACCION)\\s*:?|$)`, 'i');
  return text
    .match(pattern)?.[1]
    ?.replace(/\n?(DIAS|RAZON|DETALLE|ACCION)\s*:?$/i, '')
    .trim();
};

const parseEstimate = (text: string): GeminiEstimate | null => {
  const daysMatch = text.match(/DIAS:\s*(\d+)/i);
  const days = Number(daysMatch?.[1]);
  if (!Number.isFinite(days)) return null;

  const razon = extractField(text, 'RAZON') || 'Estimación según el insumo recibido.';
  const detalle = extractField(text, 'DETALLE') || razon;
  const accion = extractField(text, 'ACCION') || 'Revisar envase, olor, color y almacenamiento antes de usar.';

  return {
    vida_util_sugerida_dias: clampDays(days),
    razon_corta: razon.slice(0, 150),
    explicacion: detalle.slice(0, 280),
    accion_sugerida: accion.slice(0, 180)
  };
};

const buildPrompt = (input: GeminiEstimateInput, compact = false) => [
    'Agente de vencimientos para un catering en Bolivia.',
    'Lee el insumo recibido y estima su vida útil sin usar una tabla fija.',
    'Lenguaje claro para cocina y almacén.',
    'Piensa según el producto: perecible, seco, envasado, bebida, lácteo, carne, fruta, verdura u otro.',
    'Considera el ambiente estimado y si calor/frío cambia maduración, fermentación, moho, cadena de frío o estabilidad.',
    compact ? 'Sé muy breve.' : 'Explica de forma útil por qué elegiste esos días.',
    'Responde exactamente con este formato, sin markdown y sin texto adicional:',
    'DIAS: <numero entero de días recomendados>',
    'RAZON: <frase corta y clara>',
    'DETALLE: <una o dos frases útiles>',
    'ACCION: <qué debe revisar o cómo almacenar>',
    `Insumo: ${input.insumo}`,
    `Categoría: ${input.categoria}`,
    `Unidad: ${input.unidad_medida}`,
    `Fecha recepción: ${input.fecha_recepcion}`,
    `Ambiente estimado: ${input.condicion_ambiente}`
  ].join('\n');

export const estimateWithGemini = async (input: GeminiEstimateInput): Promise<GeminiEstimate> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackEstimate(input);

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  const requestEstimate = async (prompt: string) => fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{
          text: 'Devuelve solo las tres líneas DIAS, RAZON y DETALLE. No agregues introducción.'
        }]
      },
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 600
      }
    })
  });

  for (const prompt of [buildPrompt(input), buildPrompt(input, true)]) {
    const response = await requestEstimate(prompt);

    if (!response.ok) {
      console.error('Gemini vida útil error:', response.status, await response.text());
      return fallbackEstimate(input);
    }

    const data = await response.json();
    const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    const parsed = parseEstimate(text);
    if (parsed) return parsed;
    console.error('Gemini vida útil formato inválido:', text.slice(0, 220));
  }

  return fallbackEstimate(input);
};
