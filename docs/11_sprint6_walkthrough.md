# Sprint 6 Walkthrough - Vida Útil Sugerida

## Objetivo
Al recibir mercadería sin fecha impresa, el sistema sugiere automáticamente una fecha de vencimiento aproximada usando reglas locales por insumo o categoría, ajustadas por temporada y madurez.

## Recorrido Manual
1. Iniciar sesión como Gerente o Almacén.
2. Abrir **Compras**.
3. En una compra pendiente, entrar a **Ingresar a Inventario**.
4. Revisar cada lote recibido.
5. Si el producto trae fecha impresa, marcar **Tiene fecha impresa** y escribir la fecha real.
6. Si no trae fecha impresa, dejar el check apagado.
7. Seleccionar temporada: `Templado`, `Verano` o `Invierno`.
8. Seleccionar madurez: `No aplica`, `Verde`, `Medio` o `Maduro`.
9. El sistema autocompleta **Vencimiento** con la fecha sugerida.
10. Si almacén tiene mejor criterio, puede editar la fecha antes de guardar.
11. Guardar la recepción. Se crean los lotes y movimientos de inventario.

## Fórmula Validable
```text
vida_util_sugerida_dias = max(1, vida_util_dias_base + ajuste_temporada + ajuste_madurez)
fecha_vencimiento_sugerida = fecha_recepcion + vida_util_sugerida_dias
```

## Ejemplos Verificados
Regla por insumo:
```http
GET /api/vida-util/sugerir?insumo_id=1&fecha_recepcion=2026-05-03&temporada=Verano&madurez=No%20aplica
```

Resultado observado:
```json
{
  "insumo": "leche",
  "vida_util_dias_base": 5,
  "ajuste_temporada": -1,
  "vida_util_sugerida_dias": 4,
  "fecha_vencimiento_sugerida": "2026-05-07",
  "fuente": "regla_insumo"
}
```

Regla por categoría:
```http
GET /api/vida-util/sugerir?insumo_id=2&fecha_recepcion=2026-05-03&temporada=Invierno&madurez=No%20aplica
```

Resultado observado:
```json
{
  "insumo": "Arroz",
  "categoria": "Abarrotes",
  "vida_util_dias_base": 90,
  "vida_util_sugerida_dias": 90,
  "fecha_vencimiento_sugerida": "2026-08-01",
  "fuente": "regla_categoria"
}
```

## IA
No se integró IA en Sprint 6 Fase 1. La estimación queda basada en heurística local, que es defendible ante la profe y no depende de proveedores externos.

## Pruebas Técnicas
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

## Checklist Sprint 6
- [x] Tabla local de reglas por insumo.
- [x] Reglas fallback por categoría.
- [x] Ajustes por temporada y madurez.
- [x] Endpoint `GET /api/vida-util/sugerir`.
- [x] UI de recepción con fecha impresa, temporada y madurez.
- [x] Fecha sugerida autocompletada y editable.
- [x] Fecha impresa no se sobrescribe automáticamente.
- [x] IA queda opcional y no integrada.
