# Sprint 4 Walkthrough

## Objetivo
Poner el menú mensual al centro del sistema: Semana 1-4, plato por día, receta mínima por porción y cálculo de requerimiento semanal de insumos.

## Recorrido Manual
1. Iniciar sesión como Gerente o Cocinero.
2. Abrir **Menú** desde el sidebar.
3. Seleccionar mes/año y Semana 1-4.
4. Crear un plato en el panel derecho.
5. Agregar insumos a la receta mínima con cantidad por porción.
6. En el panel central, asignar plato a un día con turno `Almuerzo` y porciones estimadas.
7. Revisar el requerimiento semanal consolidado en el panel derecho.

## Pruebas Técnicas
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

## Checklist Sprint 4
- [x] Menú mensual por mes/año y Semana 1-4.
- [x] Turno por defecto `Almuerzo`.
- [x] Catálogo de platos.
- [x] Receta mínima Plato -> Insumo -> Cantidad por porción.
- [x] Endpoint de requerimiento semanal.
- [x] UI multi-panel izquierda/centro/derecha.
- [x] Sin compras sugeridas; queda fuera para Sprint 5.
