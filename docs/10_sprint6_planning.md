# Sprint 6 Planning - Vida Útil Automática

## Objetivo
Al recibir mercadería sin fecha impresa, especialmente frutas y verduras, el sistema debe sugerir una fecha de vencimiento aproximada según producto, temporada y madurez. La fecha se autocompleta en el lote, pero siempre queda editable por el usuario.

No se requiere API de OpenAI para Fase 1. La solución defendible es heurística local con reglas claras.

## Alcance Fase 1
*   Reglas locales por insumo y por categoría.
*   Ajuste por temporada: `Verano`, `Invierno`, `Templado`.
*   Ajuste por madurez: `Verde`, `Medio`, `Maduro`, `No aplica`.
*   Endpoint de sugerencia que no guarda inventario.
*   UI de ingreso de lote que autocompleta fecha si no hay fecha impresa.
*   Fecha sugerida editable antes de guardar.

## Fuera de Alcance Fase 1
*   No se integran proveedores externos.
*   No se llama OpenAI.
*   No se reemplaza una fecha impresa por una sugerida.
*   No se bloquea el ingreso si el usuario decide corregir manualmente.

## Tabla Mínima de Reglas
| Insumo | Categoría | Vida base días | Verano | Invierno | Verde | Medio | Maduro |
|---|---|---:|---:|---:|---:|---:|---:|
| Tomate | Verduras | 5 | -1 | +1 | +2 | 0 | -2 |
| Lechuga | Verduras | 3 | -1 | +1 | +1 | 0 | -1 |
| Papa | Tubérculos | 20 | -2 | +3 | 0 | 0 | 0 |
| Cebolla | Verduras | 20 | -2 | +3 | 0 | 0 | 0 |
| Zanahoria | Verduras | 10 | -1 | +2 | +1 | 0 | -1 |
| Banana | Frutas | 5 | -1 | +1 | +3 | 0 | -2 |
| Manzana | Frutas | 14 | -1 | +2 | +2 | 0 | -2 |
| Naranja | Frutas | 14 | -1 | +2 | +1 | 0 | -1 |
| Palta | Frutas | 4 | -1 | +1 | +3 | 0 | -2 |
| Huevo | Proteínas | 21 | -2 | +2 | 0 | 0 | 0 |
| Leche | Lácteos | 5 | -1 | 0 | 0 | 0 | 0 |
| Queso fresco | Lácteos | 7 | -1 | 0 | 0 | 0 | 0 |
| Pan | Panadería | 3 | -1 | 0 | 0 | 0 | 0 |
| Pollo fresco | Carnes | 2 | -1 | 0 | 0 | 0 | 0 |
| Carne de res fresca | Carnes | 3 | -1 | 0 | 0 | 0 | 0 |

Fórmula:

```text
vida_util_sugerida_dias = max(1, vida_util_dias_base + ajuste_temporada + ajuste_madurez)
fecha_vencimiento_sugerida = fecha_recepcion + vida_util_sugerida_dias
```

Ejemplo defendible:
*   Tomate recibido el `2026-05-03`.
*   Temporada `Templado`: ajuste `0`.
*   Madurez `Medio`: ajuste `0`.
*   Vida base `5`.
*   Fecha sugerida: `2026-05-08`.

## Modelo de Datos Propuesto
Fase 1 puede implementarse sin migración al inicio usando una tabla/reglas constantes en backend. Si se desea persistencia administrable, el modelo propuesto es:

```text
ReglaVidaUtil
- id
- insumo_id nullable
- categoria nullable
- vida_util_dias_base
- ajuste_verano
- ajuste_invierno
- ajuste_templado
- ajuste_verde
- ajuste_medio
- ajuste_maduro
- aplica_madurez
- estado
```

El cálculo usa prioridad:
1. Regla por `insumo_id`.
2. Regla por `categoria`.
3. Sin regla: requiere fecha manual en Fase 1.
4. IA opcional solo si el feature flag está activo.

## Endpoint Exacto
`GET /api/vida-util/sugerir?insumo_id=2&fecha_recepcion=2026-05-03&temporada=Templado&madurez=Medio`

Parámetros:
*   `insumo_id`: obligatorio.
*   `fecha_recepcion`: obligatorio, formato `YYYY-MM-DD`.
*   `temporada`: opcional, default `Templado`.
*   `madurez`: opcional, default `No aplica`.

Respuesta con regla:

```json
{
  "insumo_id": 2,
  "insumo": "Tomate",
  "categoria": "Verduras",
  "fecha_recepcion": "2026-05-03",
  "temporada": "Templado",
  "madurez": "Medio",
  "vida_util_dias_base": 5,
  "ajuste_temporada": 0,
  "ajuste_madurez": 0,
  "vida_util_sugerida_dias": 5,
  "fecha_vencimiento_sugerida": "2026-05-08",
  "fuente": "regla_insumo",
  "editable": true,
  "requiere_revision": false
}
```

Respuesta sin regla en Fase 1:

```json
{
  "insumo_id": 99,
  "insumo": "Producto sin regla",
  "fuente": "sin_regla",
  "editable": true,
  "requiere_revision": true,
  "mensaje": "Ingrese fecha manual o agregue regla de vida útil"
}
```

## UI: Recibir Mercancía / Ingreso Inventario
Pantalla actual: `/inventario/ingreso`.

Cambios esperados por lote:
*   Agregar selector **Tiene fecha impresa**.
*   Agregar selector **Temporada**.
*   Agregar selector **Madurez**.
*   Si tiene fecha impresa, el campo vencimiento queda manual.
*   Si no tiene fecha impresa, al elegir insumo/temporada/madurez se consulta la sugerencia.
*   La fecha sugerida se autocompleta y se muestra como “Sugerida por regla de insumo/categoría”.
*   El usuario puede editar la fecha antes de guardar.

## IA Opcional Fase 2
Feature flag:

```text
VIDA_UTIL_AI_ENABLED=false
```

Contrato interno futuro:
```text
estimarVidaUtilIA({ insumo, categoria, temporada, madurez }) -> dias_sugeridos
```

Regla: solo se llamaría si no existe regla por insumo ni categoría. Si el flag está desactivado, el sistema nunca llama IA.

## Plan de Implementación
1. Crear módulo backend `vida-util` con función pura de cálculo.
2. Cargar reglas locales de 10-15 insumos y fallback por categoría.
3. Crear endpoint `GET /api/vida-util/sugerir`.
4. Agregar validaciones de `insumo_id`, fecha, temporada y madurez.
5. Modificar UI de ingreso de inventario para campos `tiene_fecha_impresa`, `temporada`, `madurez`.
6. Al cambiar insumo/temporada/madurez y no tener fecha impresa, consultar endpoint y autocompletar.
7. Mantener fecha editable y enviar el valor final a `POST /api/inventario/movimientos`.
8. Agregar walkthrough y pruebas de build.

## Plan de Commits
1. `docs: planificar vida útil sugerida`
2. `feat(api): agregar reglas locales de vida útil`
3. `feat(api): exponer sugerencia de vencimiento`
4. `feat(web): autocompletar vencimiento en ingreso de inventario`
5. `docs: agregar walkthrough sprint 6`

## Criterios de Aceptación
*   Un lote sin fecha impresa recibe fecha sugerida automáticamente.
*   La sugerencia cambia al variar temporada o madurez.
*   La fecha sugerida puede editarse.
*   Una fecha impresa ingresada por el usuario no se sobrescribe.
*   Si no hay regla, el sistema pide fecha manual sin bloquear el ingreso.
*   La explicación es defendible: producto + temporada + madurez.

## Estado
Fase A completada como planificación. Implementación pendiente de OK.
