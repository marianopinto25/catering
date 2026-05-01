# Modelo de Sugerencia de Compra

## Objetivo
La compra sugerida traduce el menú semanal en cantidades operativas por insumo. No compra automáticamente: ayuda al usuario a llenar la grilla de compra con una base defendible.

## Fórmulas
Para cada insumo de las recetas del menú seleccionado:

```text
Requerido = sumatoria(cantidad_por_porcion * porciones_estimadas)
DisponibleCompra = Existencia + EnOrden
SugeridoBase = max(0, Requerido - DisponibleCompra)
Sugerido = min(SugeridoBase, LimitePerecible)
```

## Variables
*   **Requerido:** demanda calculada desde el menú de la semana. Incluye desayuno, almuerzo y cena.
*   **Existencia:** cantidad física disponible en inventario (`onHand`).
*   **EnOrden:** cantidad comprada pero no recibida (`onOrder`), proveniente de compras pendientes de ingreso.
*   **Sugerido:** cantidad recomendada para comprar.
*   **Unidad:** unidad de medida del insumo/receta. La cantidad se mantiene en esa unidad.

## Restricción de perecibles
Sprint 5 usa un límite simple por vida útil estimada:

```text
LimitePerecible = consumo_diario_estimado * vida_util_dias
consumo_diario_estimado = Requerido / dias_servicio_semana
```

Supuestos Sprint 5:
*   `dias_servicio_semana = 7`, salvo que el menú tenga menos días cargados; en ese caso se usa la cantidad de días con platos.
*   Si no hay dato de vida útil por insumo, se usa `vida_util_dias = 7`.
*   Para no inventar compras excesivas, el sistema nunca sugiere menos de 0.
*   La restricción perecible es una guía operativa; el usuario puede ajustar la cantidad en la grilla antes de guardar la compra.

## Cómo se determinan unidades
La unidad sale de la receta del plato (`PlatoInsumo.unidad_medida`) y debe ser coherente con el insumo. Ejemplo: si la receta dice arroz `0.12 Kg` por porción y hay 120 porciones, el requerido es `14.4 Kg`.
