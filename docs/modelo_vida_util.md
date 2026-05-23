# Modelo de Vida Útil Sugerida

## Objetivo
Cuando se recibe mercadería sin fecha impresa, el sistema sugiere una fecha de vencimiento aproximada. La sugerencia no bloquea al usuario: se autocompleta en el lote y queda editable antes de guardar el ingreso a inventario.

## Fórmula
```text
vida_util_sugerida_dias = max(1, vida_util_dias_base + ajuste_temporada + ajuste_madurez)
fecha_vencimiento_sugerida = fecha_recepcion + vida_util_sugerida_dias
```

## Variables
*   **vida_util_dias_base:** regla principal asociada al insumo. Si no existe regla por insumo, se usa regla por categoría.
*   **ajuste_temporada:** variación por condiciones climáticas operativas.
*   **ajuste_madurez:** variación por estado del producto recibido.
*   **fecha_recepcion:** fecha en la que se registra el ingreso de inventario.
*   **fecha_vencimiento_sugerida:** fecha propuesta; el usuario puede reemplazarla.

## Temporadas
Para Sprint 6 se usan tres valores simples:
*   `Verano`: reduce vida útil de frutas, verduras, lácteos y pan por mayor deterioro.
*   `Invierno`: aumenta ligeramente la vida útil de frutas y verduras.
*   `Templado`: no aplica ajuste.

## Madurez
Aplica principalmente a frutas y verduras:
*   `Verde`: suma días.
*   `Medio`: sin ajuste.
*   `Maduro`: resta días.
*   `No aplica`: para abarrotes, huevos, lácteos o productos donde la madurez visual no define la vida útil.

## Tabla mínima de reglas
| Insumo | Categoría | Vida base días | Verano | Invierno | Verde | Medio | Maduro | Observación |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Tomate | Verduras | 5 | -1 | +1 | +2 | 0 | -2 | Depende mucho de madurez. |
| Lechuga | Verduras | 3 | -1 | +1 | +1 | 0 | -1 | Perecible rápido por humedad. |
| Papa | Tubérculos | 20 | -2 | +3 | 0 | 0 | 0 | Guardar seco y ventilado. |
| Cebolla | Verduras | 20 | -2 | +3 | 0 | 0 | 0 | Similar a papa en almacén seco. |
| Zanahoria | Verduras | 10 | -1 | +2 | +1 | 0 | -1 | Mejor refrigerada. |
| Banana | Frutas | 5 | -1 | +1 | +3 | 0 | -2 | Maduración visible. |
| Manzana | Frutas | 14 | -1 | +2 | +2 | 0 | -2 | Más estable que banana. |
| Naranja | Frutas | 14 | -1 | +2 | +1 | 0 | -1 | Vida media en almacén fresco. |
| Palta | Frutas | 4 | -1 | +1 | +3 | 0 | -2 | Madurez define uso real. |
| Huevo | Proteínas | 21 | -2 | +2 | 0 | 0 | 0 | Madurez no aplica. |
| Leche | Lácteos | 5 | -1 | 0 | 0 | 0 | 0 | Si trae fecha impresa, prevalece la impresa. |
| Queso fresco | Lácteos | 7 | -1 | 0 | 0 | 0 | 0 | Refrigeración requerida. |
| Pan | Panadería | 3 | -1 | 0 | 0 | 0 | 0 | Sugerencia corta por moho/sequedad. |
| Pollo fresco | Carnes | 2 | -1 | 0 | 0 | 0 | 0 | Debe mantenerse refrigerado. |
| Carne de res fresca | Carnes | 3 | -1 | 0 | 0 | 0 | 0 | Debe mantenerse refrigerada. |

## Reglas por categoría de respaldo
Si el insumo no tiene regla exacta:
| Categoría | Vida base días | Verano | Invierno | Madurez |
|---|---:|---:|---:|---|
| Verduras | 5 | -1 | +1 | aplica |
| Frutas | 7 | -1 | +1 | aplica |
| Tubérculos | 18 | -2 | +3 | no aplica |
| Lácteos | 5 | -1 | 0 | no aplica |
| Carnes | 2 | -1 | 0 | no aplica |
| Panadería | 3 | -1 | 0 | no aplica |
| Abarrotes | 90 | 0 | 0 | no aplica |

## Prioridad de decisión
1. Si el producto trae fecha impresa, el usuario registra esa fecha y no se reemplaza automáticamente.
2. Si no hay fecha impresa y existe regla por insumo, se usa esa regla.
3. Si no hay regla por insumo y existe regla por categoría, se usa la categoría.
4. Si no hay regla, Sprint 6 Fase 1 devuelve `requiere_revision = true` para que el usuario ingrese la fecha manualmente.
5. La Fase 2 opcional puede consultar IA solo cuando no exista regla local y el feature flag esté activo.

## IA opcional
No es necesaria para Fase 1. Para Sprint final puede quedar preparada con:
```text
VIDA_UTIL_AI_ENABLED=false
```

Cuando esté desactivada, el endpoint nunca llama proveedores externos. Cuando esté activada en una fase posterior, solo se usaría si no existe regla local por insumo ni categoría.
