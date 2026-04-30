# Sprint 4 Walkthrough

## Objetivo
Poner el menú mensual al centro del sistema: Semana 1-4, desayuno/almuerzo/cena por día, receta mínima por porción y cálculo de requerimiento semanal de insumos.

## Recorrido Manual
1. Iniciar sesión como Gerente o Cocinero.
2. Abrir **Menú** desde el sidebar.
3. Seleccionar mes/año y Semana 1-4.
4. Crear un plato en el panel derecho.
5. Agregar insumos a la receta mínima con cantidad por porción.
6. En el panel central, asignar plato a un día y servicio: `Desayuno`, `Almuerzo` o `Cena`.
7. Revisar el requerimiento semanal consolidado en el panel derecho.
8. Para cargar desde Excel, descargar el formato CSV, editarlo en Excel y guardarlo como CSV.

## Formato de carga desde Excel
```csv
semana,dia,turno,plato,porciones
1,Lunes,Desayuno,Avena con frutas,80
1,Lunes,Almuerzo,Arroz con pollo,120
1,Lunes,Cena,Sopa de verduras,90
```

## Pruebas Técnicas
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

## Checklist Sprint 4
- [x] Menú mensual por mes/año y Semana 1-4.
- [x] Servicios: `Desayuno`, `Almuerzo`, `Cena`.
- [x] Importación CSV exportado desde Excel.
- [x] Catálogo de platos.
- [x] Receta mínima Plato -> Insumo -> Cantidad por porción.
- [x] Endpoint de requerimiento semanal.
- [x] UI multi-panel izquierda/centro/derecha.
- [x] Sin compras sugeridas; queda fuera para Sprint 5.
