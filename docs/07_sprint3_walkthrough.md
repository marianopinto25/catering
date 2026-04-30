# Sprint 3 Walkthrough

## Objetivo
Corregir el lenguaje funcional del sistema para que el módulo hable como inventario real: proveedor con persona responsable, inventario con Existencia / En orden / Solicitado, y vencido/dañado como ajuste.

## Recorrido Manual
1. Iniciar sesión como Gerente.
2. Abrir **Manejo Inv. y Compras** y validar que no aparezca "Panel de Control" como título visible.
3. Abrir **Proveedores** y crear/editar un proveedor con datos de empresa y persona responsable.
4. Abrir **Inventario** y confirmar columnas:
   - Existencia
   - En orden
   - Solicitado
5. Expandir un insumo y registrar un ajuste por vencido o dañado desde un lote.
6. Abrir **Alertas** y verificar que el texto esté orientado a anticipar preparación en cocina.

## Pruebas Técnicas
```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

## Checklist Sprint 3
- [x] Proveedor guarda persona responsable.
- [x] Inventario muestra Existencia / En orden / Solicitado.
- [x] `GET /api/inventario/resumen` disponible.
- [x] Ajustes registran vencido/dañado como transacción.
- [x] UI evita "Panel de Control" y "Dashboard" como labels visibles.
- [x] Alertas usan wording para anticipación de cocina.
