# Sprint 5 Walkthrough - Compra con Sugerencia por Menú

## Objetivo
Registrar compras desde una pantalla operativa tipo Farmacorp: proveedor y datos de compra, grilla editable, menú semanal visible y lista sugerida de compra con botón para copiar cantidades.

No se agregaron librerías nuevas y los endpoints actuales de compra se mantienen.

## Diseño Exacto de Pantalla
Ruta: `/compras/nueva`

```text
┌──────────────────────┬────────────────────────────────────────┬──────────────────────────────┐
│ Datos de compra      │ Grilla de compra                       │ Menú semana seleccionada      │
│ Proveedor            │ Insumo | Unidad | Cant. | P.Unit | Sub │ Día | Servicio | Plato | Porc │
│ Fecha                │ Arroz  | Kg     | 7.4   | 0.00   | 0.0 │ Lun | Almuerzo | ...   | 120  │
│ Año                  │ + Agregar línea / Quitar línea         │                              │
│ Mes                  │                                        ├──────────────────────────────┤
│ Semana 1-4           │ Total compra                           │ Sugerencia de compra          │
│ Guardar compra       │                                        │ Insumo | Req | Exist | Orden │
│                      │                                        │ Sug | Unidad                   │
│                      │                                        │ [Copiar sugerencia a compra]  │
└──────────────────────┴────────────────────────────────────────┴──────────────────────────────┘
```

Reglas de interacción:
1. El usuario selecciona proveedor, fecha, año, mes y semana.
2. Al cambiar año/mes/semana se consulta la sugerencia y se actualizan menú y panel de sugerencia.
3. La grilla central no se modifica automáticamente para no perder edición manual.
4. **Copiar sugerencia a la compra** agrega o reemplaza líneas con `sugerido > 0`, usando `insumo_id`, `unidad` y `cantidad = sugerido`.
5. El usuario completa precio unitario y puede ajustar cantidades antes de guardar.

## Endpoint Exacto
`GET /api/compras/sugerencia?mes=4&semana=1`

Parámetros:
*   `mes`: obligatorio, entero `1-12`.
*   `semana`: obligatorio, entero `1-4`.
*   `anio`: opcional, entero. Ejemplo defendible: `2026`. Si no se envía, la implementación puede usar el año operativo actual.

Ejemplo request:

```http
GET /api/compras/sugerencia?anio=2026&mes=4&semana=1
Authorization: Bearer <token>
```

Ejemplo response:

```json
{
  "anio": 2026,
  "mes": 4,
  "semana": 1,
  "menu": {
    "id": 12,
    "estado": "BORRADOR",
    "items": [
      {
        "dia": "Lunes",
        "turno": "Almuerzo",
        "plato": {
          "id": 1,
          "nombre": "Pollo al horno"
        },
        "porciones_estimadas": 120
      }
    ]
  },
  "items": [
    {
      "insumo_id": 1,
      "nombre": "Arroz",
      "unidad": "Kg",
      "requerido": 14.4,
      "existencia": 4,
      "enOrden": 3,
      "sugerido": 7.4,
      "vida_util_dias": 7,
      "limite_perecible": 14.4
    }
  ]
}
```

Errores esperados:
*   `400`: mes o semana inválidos.
*   `404`: no existe menú para el mes/año seleccionado.
*   `500`: error interno al calcular sugerencia.

## Modelo Matemático
Para cada insumo:

```text
Requerido = sumatoria(cantidad_por_porcion * porciones_estimadas)
SugeridoBase = max(0, Requerido - (Existencia + EnOrden))
Sugerido = min(SugeridoBase, LimitePerecible)
```

Restricción perecible:

```text
LimitePerecible = consumo_diario_estimado * vida_util_dias
consumo_diario_estimado = Requerido / dias_servicio_semana
```

## Trazabilidad: Unidades
Respuesta a "¿cómo determinas unidades?":
*   La unidad sale de la receta del plato (`PlatoInsumo.unidad_medida`).
*   El requerido se calcula en esa misma unidad.
*   La sugerencia conserva la unidad hasta copiarla a la grilla.
*   Si un mismo insumo aparece con unidades distintas en recetas distintas, se debe reportar inconsistencia para corregir receta antes de copiar.

## Plan de Commits
1. `docs: planificar modelo de compra sugerida`
   Actualiza fórmula, supuestos, perecibles y trazabilidad de unidades.
2. `docs: documentar contrato de sugerencia de compra`
   Agrega endpoint, parámetros, response y errores esperados.
3. `docs: definir pantalla multi-panel de nueva compra`
   Detalla layout de tres paneles, selector de semana y comportamiento de copia.
4. `feat(api): agregar endpoint de sugerencia de compra`
   Fase B, solo cuando exista OK.
5. `feat(web): convertir nueva compra en pantalla multi-panel`
   Fase B, solo cuando exista OK.
6. `docs: agregar walkthrough y evidencias sprint 5`
   Fase B, con trazabilidad y screenshots.

## Recorrido Manual Esperado
1. Iniciar sesión como Gerente.
2. Abrir **Compras** y entrar a **Nueva Compra**.
3. Seleccionar proveedor y fecha de compra.
4. Seleccionar mes y Semana 1-4 del menú.
5. Revisar el panel derecho superior con desayuno, almuerzo y cena de la semana.
6. Revisar el panel derecho inferior con:
   - Requerido
   - Existencia
   - En orden
   - Sugerido
7. Presionar **Copiar** para llenar la grilla central con los insumos sugeridos.
8. Ajustar precios unitarios y cantidades si corresponde.
9. Guardar la compra. Queda en estado `PENDIENTE_INGRESO`.

## Fórmula Validable
```text
Sugerido = min(max(0, Requerido - (Existencia + EnOrden)), LimitePerecible)
```

Las unidades salen de la receta del plato (`PlatoInsumo.unidad_medida`). Ejemplo: si la receta usa `Kg`, la sugerencia sale en `Kg`.

## Pruebas Técnicas
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

## Evidencia Técnica
Endpoint verificado con sesión de Gerente:

```http
GET /api/compras/sugerencia?anio=2026&mes=4&semana=1
```

Resultado esperado observado:
*   `200 OK` con menú de Semana 1 y sugerencias por insumo.
*   `400 Bad Request` si `mes` o `semana` están fuera de rango.
*   `404 Not Found` si no existe menú para el mes/año seleccionado.

Builds verificados:
*   API: `npm run build --workspace=apps/api`
*   Web: `npm run build --workspace=apps/web`

## Screenshots
Pendiente de captura automática: el entorno no tiene Playwright/Chromium instalado y no se agregaron librerías nuevas por regla del sprint. La pantalla quedó disponible para revisión local en `/compras/nueva`.

## Checklist Sprint 5
- [x] Fórmulas y supuestos documentados.
- [x] Endpoint documentado con ejemplos request/response.
- [x] UI route `/compras/nueva` ajustada a multi-panel.
- [x] Trazabilidad de unidades documentada.
- [x] Implementación backend: `GET /api/compras/sugerencia`.
- [x] Implementación frontend: pantalla de compra multi-panel.
- [x] Botón **Copiar sugerencia a la compra** llena la grilla.
- [ ] Screenshots pendientes de herramienta de captura aprobada.
