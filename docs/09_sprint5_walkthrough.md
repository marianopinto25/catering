# Sprint 5 Walkthrough

## Objetivo
Registrar compras con apoyo del menú semanal: ver menú, calcular sugerencia y copiar cantidades sugeridas a la grilla de compra.

## Recorrido Manual
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

## Checklist Sprint 5
- [x] Endpoint `GET /api/compras/sugerencia`.
- [x] Cálculo desde menú semanal, recetas, existencia y en orden.
- [x] Pantalla de compra multi-panel.
- [x] Menú semanal visible en la pantalla de compra.
- [x] Lista sugerida visible.
- [x] Botón para copiar sugerencia a la grilla.
- [x] Endpoints actuales de compra se mantienen.
