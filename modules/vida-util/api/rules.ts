type Temporada = 'Verano' | 'Invierno' | 'Templado';
type Madurez = 'Verde' | 'Medio' | 'Maduro' | 'No aplica';

export interface VidaUtilRule {
  nombre?: string;
  categoria?: string;
  vida_util_dias_base: number;
  verano: number;
  invierno: number;
  templado: number;
  verde: number;
  medio: number;
  maduro: number;
  aplica_madurez: boolean;
  razon_base: string;
  razon_temporada: string;
  razon_madurez?: string;
}

export const TEMPORADAS: Temporada[] = ['Verano', 'Invierno', 'Templado'];
export const MADURECES: Madurez[] = ['Verde', 'Medio', 'Maduro', 'No aplica'];

const normalize = (value: string) => value.trim().toLowerCase();

export const rulesByInsumo = new Map<string, VidaUtilRule>([
  ['tomate', { nombre: 'Tomate', categoria: 'Verduras', vida_util_dias_base: 5, verano: -1, invierno: 1, templado: 0, verde: 2, medio: 0, maduro: -2, aplica_madurez: true, razon_base: 'El tomate sigue madurando después de cosechado y se ablanda rápido.', razon_temporada: 'El calor acelera la pérdida de firmeza y el frío moderado la retrasa.', razon_madurez: 'Mientras más maduro llega, menos margen queda antes de deteriorarse.' }],
  ['lechuga', { nombre: 'Lechuga', categoria: 'Verduras', vida_util_dias_base: 3, verano: -1, invierno: 1, templado: 0, verde: 1, medio: 0, maduro: -1, aplica_madurez: true, razon_base: 'La lechuga pierde agua y crocancia muy rápido.', razon_temporada: 'La humedad y el calor aceleran marchitez y manchas.', razon_madurez: 'Hojas más maduras o golpeadas tienen menor duración.' }],
  ['papa', { nombre: 'Papa', categoria: 'Tubérculos', vida_util_dias_base: 20, verano: -2, invierno: 3, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'La papa dura más si se almacena seca, ventilada y sin luz.', razon_temporada: 'El calor favorece brotes y deshidratación; el clima frío/seco ayuda.', razon_madurez: 'La madurez visual no se usa para este insumo.' }],
  ['cebolla', { nombre: 'Cebolla', categoria: 'Verduras', vida_util_dias_base: 20, verano: -2, invierno: 3, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'La cebolla conserva bien si está seca y ventilada.', razon_temporada: 'El calor y humedad aumentan brotes y pudrición.', razon_madurez: 'La madurez visual no se usa para este insumo.' }],
  ['zanahoria', { nombre: 'Zanahoria', categoria: 'Verduras', vida_util_dias_base: 10, verano: -1, invierno: 2, templado: 0, verde: 1, medio: 0, maduro: -1, aplica_madurez: true, razon_base: 'La zanahoria se conserva mejor que hojas, pero pierde firmeza con calor.', razon_temporada: 'El frío moderado ayuda a conservar textura.', razon_madurez: 'Si llega más madura o blanda, se reduce la vida útil.' }],
  ['banana', { nombre: 'Banana', categoria: 'Frutas', vida_util_dias_base: 5, verano: -1, invierno: 1, templado: 0, verde: 3, medio: 0, maduro: -2, aplica_madurez: true, razon_base: 'La banana es climatérica: sigue madurando después de cosechada.', razon_temporada: 'En ambiente caluroso produce y responde más rápido al etileno, por eso madura antes; en frío moderado se ralentiza.', razon_madurez: 'Una banana verde tiene más días de maduración; una madura debe consumirse pronto.' }],
  ['manzana', { nombre: 'Manzana', categoria: 'Frutas', vida_util_dias_base: 14, verano: -1, invierno: 2, templado: 0, verde: 2, medio: 0, maduro: -2, aplica_madurez: true, razon_base: 'La manzana es más estable, pero sigue respirando y madurando.', razon_temporada: 'El calor acelera respiración y pérdida de firmeza.', razon_madurez: 'Más madurez implica menos días útiles.' }],
  ['naranja', { nombre: 'Naranja', categoria: 'Frutas', vida_util_dias_base: 14, verano: -1, invierno: 2, templado: 0, verde: 1, medio: 0, maduro: -1, aplica_madurez: true, razon_base: 'La naranja suele durar más por su cáscara protectora.', razon_temporada: 'El calor acelera deshidratación y riesgo de moho.', razon_madurez: 'Fruta muy madura tiene menos margen de almacenamiento.' }],
  ['palta', { nombre: 'Palta', categoria: 'Frutas', vida_util_dias_base: 4, verano: -1, invierno: 1, templado: 0, verde: 3, medio: 0, maduro: -2, aplica_madurez: true, razon_base: 'La palta cambia rápido de firme a sobremadura.', razon_temporada: 'El calor acelera su ablandamiento.', razon_madurez: 'Si está verde puede esperar; si está madura debe usarse pronto.' }],
  ['huevo', { nombre: 'Huevo', categoria: 'Proteínas', vida_util_dias_base: 21, verano: -2, invierno: 2, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'El huevo tiene vida útil media si se mantiene limpio y fresco.', razon_temporada: 'El calor aumenta riesgo microbiológico y reduce margen de seguridad.', razon_madurez: 'La madurez visual no aplica.' }],
  ['leche', { nombre: 'Leche', categoria: 'Lácteos', vida_util_dias_base: 5, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'La leche es sensible a ruptura de cadena de frío.', razon_temporada: 'En clima caluroso se reduce margen por mayor riesgo de deterioro.', razon_madurez: 'La madurez visual no aplica.' }],
  ['queso fresco', { nombre: 'Queso fresco', categoria: 'Lácteos', vida_util_dias_base: 7, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'El queso fresco tiene humedad alta y requiere refrigeración.', razon_temporada: 'El calor aumenta riesgo de acidificación y deterioro.', razon_madurez: 'La madurez visual no aplica.' }],
  ['pan', { nombre: 'Pan', categoria: 'Panadería', vida_util_dias_base: 3, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'El pan se seca o desarrolla moho en pocos días.', razon_temporada: 'El calor y humedad aceleran moho.', razon_madurez: 'La madurez visual no aplica.' }],
  ['pollo fresco', { nombre: 'Pollo fresco', categoria: 'Carnes', vida_util_dias_base: 2, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'El pollo fresco es altamente perecible y requiere refrigeración estricta.', razon_temporada: 'El calor reduce el margen seguro si hubo exposición.', razon_madurez: 'La madurez visual no aplica.' }],
  ['pollo', { nombre: 'Pollo', categoria: 'Carnes', vida_util_dias_base: 2, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'El pollo fresco es altamente perecible y requiere refrigeración estricta.', razon_temporada: 'El calor reduce el margen seguro si hubo exposición.', razon_madurez: 'La madurez visual no aplica.' }],
  ['carne de res fresca', { nombre: 'Carne de res fresca', categoria: 'Carnes', vida_util_dias_base: 3, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'La carne fresca tiene vida útil corta y depende de refrigeración.', razon_temporada: 'El calor reduce el margen seguro si hubo exposición.', razon_madurez: 'La madurez visual no aplica.' }],
]);

export const rulesByCategoria = new Map<string, VidaUtilRule>([
  ['verduras', { categoria: 'Verduras', vida_util_dias_base: 5, verano: -1, invierno: 1, templado: 0, verde: 1, medio: 0, maduro: -1, aplica_madurez: true, razon_base: 'Las verduras frescas pierden agua y textura con el tiempo.', razon_temporada: 'El calor acelera marchitez y deterioro.', razon_madurez: 'Mayor madurez o golpes reducen la vida útil.' }],
  ['frutas', { categoria: 'Frutas', vida_util_dias_base: 7, verano: -1, invierno: 1, templado: 0, verde: 2, medio: 0, maduro: -2, aplica_madurez: true, razon_base: 'Las frutas continúan respirando y algunas siguen madurando.', razon_temporada: 'El ambiente caluroso acelera maduración y pérdida de firmeza.', razon_madurez: 'Fruta verde dura más; fruta madura debe rotar primero.' }],
  ['tubérculos', { categoria: 'Tubérculos', vida_util_dias_base: 18, verano: -2, invierno: 3, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'Los tubérculos duran más en lugar seco, oscuro y ventilado.', razon_temporada: 'El calor favorece brotes y deshidratación.', razon_madurez: 'La madurez visual no aplica.' }],
  ['lácteos', { categoria: 'Lácteos', vida_util_dias_base: 5, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'Los lácteos dependen de cadena de frío.', razon_temporada: 'El calor reduce margen si hay exposición fuera de refrigeración.', razon_madurez: 'La madurez visual no aplica.' }],
  ['carnes', { categoria: 'Carnes', vida_util_dias_base: 2, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'Las carnes frescas tienen vida útil corta y alto riesgo si se rompe frío.', razon_temporada: 'El calor reduce el margen seguro.', razon_madurez: 'La madurez visual no aplica.' }],
  ['panadería', { categoria: 'Panadería', vida_util_dias_base: 3, verano: -1, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'Panificados pierden textura y pueden desarrollar moho.', razon_temporada: 'El calor y humedad aceleran moho.', razon_madurez: 'La madurez visual no aplica.' }],
  ['abarrotes', { categoria: 'Abarrotes', vida_util_dias_base: 90, verano: 0, invierno: 0, templado: 0, verde: 0, medio: 0, maduro: 0, aplica_madurez: false, razon_base: 'Abarrotes secos duran más si se almacenan cerrados y sin humedad.', razon_temporada: 'La temporada no cambia la regla base en condiciones normales.', razon_madurez: 'La madurez visual no aplica.' }],
]);

export const findRule = (nombre: string, categoria: string) => {
  const insumoRule = rulesByInsumo.get(normalize(nombre));
  if (insumoRule) return { rule: insumoRule, fuente: 'regla_insumo' as const };

  const categoriaRule = rulesByCategoria.get(normalize(categoria));
  if (categoriaRule) return { rule: categoriaRule, fuente: 'regla_categoria' as const };

  return null;
};

export const getTemporadaAjuste = (rule: VidaUtilRule, temporada: Temporada) => {
  if (temporada === 'Verano') return rule.verano;
  if (temporada === 'Invierno') return rule.invierno;
  return rule.templado;
};

export const getMadurezAjuste = (rule: VidaUtilRule, madurez: Madurez) => {
  if (!rule.aplica_madurez || madurez === 'No aplica') return 0;
  if (madurez === 'Verde') return rule.verde;
  if (madurez === 'Maduro') return rule.maduro;
  return rule.medio;
};
