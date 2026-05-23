interface PurchaseSuggestionForAI {
  insumo_id: number;
  nombre: string;
  unidad: string;
  requerido: number;
  existencia: number;
  enOrden: number;
  sugerido: number;
  diasServicio: number;
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const extractReasons = (text: string) => {
  const reasons = new Map<number, string>();
  for (const line of text.split('\n')) {
    const match = line.match(/^(\d+)\s*:\s*(.+)$/);
    if (match) reasons.set(Number(match[1]), match[2].trim());
  }
  return reasons;
};

export const explainPurchaseSuggestionWithGemini = async (
  items: PurchaseSuggestionForAI[],
  context: { anio: number; mes: number; semana: number }
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || items.length === 0) return new Map<number, string>();

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const prompt = [
    'Eres un asistente de compras para catering en Bolivia.',
    'Explica por qué se sugiere comprar o no comprar cada insumo.',
    'No cambies las cantidades: solo explica la fórmula Requerido - (Existencia + En orden).',
    'Lenguaje simple para gerente, chef o encargado de almacén.',
    'Responde una línea por insumo con este formato exacto:',
    '<insumo_id>: <explicación breve>',
    `Mes: ${context.mes}/${context.anio}. Semana: ${context.semana}.`,
    'Datos:',
    ...items.map(item => [
      `ID ${item.insumo_id}`,
      `Insumo ${item.nombre}`,
      `Unidad ${item.unidad}`,
      `Requerido ${item.requerido}`,
      `Existencia ${item.existencia}`,
      `En orden ${item.enOrden}`,
      `Sugerido ${item.sugerido}`,
      `Dias con servicio ${item.diasServicio}`
    ].join(' | '))
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
        parts: [{ text: 'No inventes cantidades. Devuelve solo líneas ID: explicación.' }]
      },
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) {
    console.error('Gemini sugerencia compra error:', response.status, await response.text());
    return new Map<number, string>();
  }

  const data = await response.json();
  const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  return extractReasons(text);
};
