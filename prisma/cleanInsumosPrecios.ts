import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CatalogItem = {
  nombre: string;
  marca: string;
  unidad_medida: string;
  categoria: string;
  stock_minimo: number;
  precio_unitario: number;
};

const catalogo: CatalogItem[] = [
  { nombre: 'Aceite', marca: 'Fino', unidad_medida: 'L', categoria: 'Abarrotes', stock_minimo: 5, precio_unitario: 14.90 },
  { nombre: 'Agua', marca: 'Vital', unidad_medida: 'L', categoria: 'Bebidas', stock_minimo: 12, precio_unitario: 3.50 },
  { nombre: 'Ajinomoto', marca: 'Ajinomoto', unidad_medida: 'Unidad', categoria: 'Condimentos', stock_minimo: 10, precio_unitario: 5.80 },
  { nombre: 'Arroz', marca: 'Grano de Oro', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 10, precio_unitario: 8.70 },
  { nombre: 'Atún', marca: 'Real', unidad_medida: 'Lata', categoria: 'Proteínas', stock_minimo: 20, precio_unitario: 9.90 },
  { nombre: 'Avena', marca: 'Quaker', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 4, precio_unitario: 15.60 },
  { nombre: 'Azúcar', marca: 'Guabirá', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 5, precio_unitario: 6.40 },
  { nombre: 'Banana', marca: 'Chapare', unidad_medida: 'Kg', categoria: 'Frutas', stock_minimo: 6, precio_unitario: 6.20 },
  { nombre: 'Café', marca: 'Copacabana', unidad_medida: 'Kg', categoria: 'Bebidas', stock_minimo: 2, precio_unitario: 48.90 },
  { nombre: 'Carne de res', marca: 'Frigorífico local', unidad_medida: 'Kg', categoria: 'Carnes', stock_minimo: 6, precio_unitario: 42.80 },
  { nombre: 'Cebolla', marca: 'Valle alto', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 5, precio_unitario: 5.30 },
  { nombre: 'Fideo', marca: 'Famosa', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 6, precio_unitario: 10.40 },
  { nombre: 'Granola', marca: 'Natural Mix', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 3, precio_unitario: 32.50 },
  { nombre: 'Harina', marca: 'Blanca Flor', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 5, precio_unitario: 7.80 },
  { nombre: 'Huevo', marca: 'Avícola local', unidad_medida: 'Unidad', categoria: 'Proteínas', stock_minimo: 30, precio_unitario: 0.85 },
  { nombre: 'Jugo de fruta', marca: 'Del Valle', unidad_medida: 'L', categoria: 'Bebidas', stock_minimo: 20, precio_unitario: 7.60 },
  { nombre: 'Leche', marca: 'Pil', unidad_medida: 'L', categoria: 'Lácteos', stock_minimo: 3, precio_unitario: 6.90 },
  { nombre: 'Lechuga', marca: 'Hortalizas del valle', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 3, precio_unitario: 9.50 },
  { nombre: 'Mermelada', marca: 'Dulce Hogar', unidad_medida: 'Kg', categoria: 'Abarrotes', stock_minimo: 3, precio_unitario: 18.70 },
  { nombre: 'Pan', marca: 'Panadería local', unidad_medida: 'Unidad', categoria: 'Panadería', stock_minimo: 80, precio_unitario: 0.65 },
  { nombre: 'Papa', marca: 'Altiplano', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 8, precio_unitario: 4.80 },
  { nombre: 'Pollo', marca: 'Sofía', unidad_medida: 'Kg', categoria: 'Carnes', stock_minimo: 8, precio_unitario: 21.90 },
  { nombre: 'Queso', marca: 'Chaqueño', unidad_medida: 'Kg', categoria: 'Lácteos', stock_minimo: 4, precio_unitario: 34.50 },
  { nombre: 'Té', marca: 'Windsor', unidad_medida: 'Kg', categoria: 'Bebidas', stock_minimo: 1, precio_unitario: 42.20 },
  { nombre: 'Tomate', marca: 'Hortalizas del valle', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 5, precio_unitario: 7.40 },
  { nombre: 'Verduras mixtas', marca: 'Mercado local', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 8, precio_unitario: 8.90 },
  { nombre: 'Yogurt', marca: 'Delizia', unidad_medida: 'L', categoria: 'Lácteos', stock_minimo: 4, precio_unitario: 11.60 },
  { nombre: 'Zanahoria', marca: 'Valle alto', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 5, precio_unitario: 5.10 },
  { nombre: 'Zapallo', marca: 'Mercado local', unidad_medida: 'Kg', categoria: 'Verduras', stock_minimo: 6, precio_unitario: 6.70 }
];

const normalize = (value: string) => value.trim().toLowerCase();

const proveedores = [
  { nit_rut: 'PROV-ABARROTES-001', razon_social: 'Distribuidora Abarrotes Andina', telefono: '+59170010001' },
  { nit_rut: 'PROV-CARNES-001', razon_social: 'Proveedor de Carnes Sofía', telefono: '+59170010002' },
  { nit_rut: '12345678-9', razon_social: 'Proveedor de Lácteos S.A.', telefono: '+12345678' },
  { nit_rut: 'PROV-VERDURAS-001', razon_social: 'Mercado Mayorista de Verduras', telefono: '+59170010003' },
  { nit_rut: 'PROV-BEBIDAS-001', razon_social: 'Distribuidora Bebidas La Paz', telefono: '+59170010004' }
];

const proveedorPorCategoria = (categoria: string) => {
  const normalized = normalize(categoria);
  if (normalized.includes('carne') || normalized.includes('prote')) return 'Proveedor de Carnes Sofía';
  if (normalized.includes('láct') || normalized.includes('leche')) return 'Proveedor de Lácteos S.A.';
  if (normalized.includes('verdura') || normalized.includes('fruta')) return 'Mercado Mayorista de Verduras';
  if (normalized.includes('bebida')) return 'Distribuidora Bebidas La Paz';
  return 'Distribuidora Abarrotes Andina';
};

const proveedoresAlternativos = (item: CatalogItem) => {
  const normalized = normalize(item.categoria);
  if (normalized.includes('verdura') || normalized.includes('fruta')) {
    return [
      { razon_social: 'Distribuidora Abarrotes Andina', precio_unitario: Number((item.precio_unitario * 1.08).toFixed(2)) }
    ];
  }
  if (normalized.includes('bebida')) {
    return [
      { razon_social: 'Distribuidora Abarrotes Andina', precio_unitario: Number((item.precio_unitario * 1.06).toFixed(2)) }
    ];
  }
  if (normalized.includes('láct') || normalized.includes('leche')) {
    return [
      { razon_social: 'Distribuidora Abarrotes Andina', precio_unitario: Number((item.precio_unitario * 1.05).toFixed(2)) }
    ];
  }
  if (normalized.includes('carne') || normalized.includes('prote')) {
    return [
      { razon_social: 'Mercado Mayorista de Verduras', precio_unitario: Number((item.precio_unitario * 1.04).toFixed(2)) }
    ];
  }
  return [
    { razon_social: 'Distribuidora Bebidas La Paz', precio_unitario: Number((item.precio_unitario * 1.07).toFixed(2)) }
  ];
};

const upsertProveedorInsumo = async (
  proveedorId: number,
  insumoId: number,
  precioUnitario: number,
  esPreferido: boolean
) => {
  await prisma.proveedorInsumo.upsert({
    where: { proveedor_id_insumo_id: { proveedor_id: proveedorId, insumo_id: insumoId } },
    update: { precio_unitario: precioUnitario, es_preferido: esPreferido, estado: 'Activo' },
    create: { proveedor_id: proveedorId, insumo_id: insumoId, precio_unitario: precioUnitario, es_preferido: esPreferido, estado: 'Activo' }
  });
};

const vincularProveedores = async (item: CatalogItem, insumoId: number, proveedorMap: Map<string, number>) => {
  const proveedorPreferido = proveedorPorCategoria(item.categoria);
  const proveedorPreferidoId = proveedorMap.get(proveedorPreferido);

  if (proveedorPreferidoId) {
    await upsertProveedorInsumo(proveedorPreferidoId, insumoId, item.precio_unitario, true);
  }

  for (const alternativo of proveedoresAlternativos(item)) {
    if (alternativo.razon_social === proveedorPreferido) continue;
    const proveedorId = proveedorMap.get(alternativo.razon_social);
    if (proveedorId) {
      await upsertProveedorInsumo(proveedorId, insumoId, alternativo.precio_unitario, false);
    }
  }
};

async function main() {
  const proveedorMap = new Map<string, number>();
  for (const proveedor of proveedores) {
    const saved = await prisma.proveedor.upsert({
      where: { nit_rut: proveedor.nit_rut },
      update: { ...proveedor, estado: 'Activo' },
      create: {
        ...proveedor,
        responsable_nombre: 'Encargado comercial',
        responsable_cargo: 'Ventas',
        responsable_telefono: proveedor.telefono,
        responsable_email: 'ventas@proveedor.test',
        estado: 'Activo'
      }
    });
    proveedorMap.set(saved.razon_social, saved.id);
  }

  const actuales = await prisma.insumo.findMany();
  const usados = new Set<number>();

  for (const item of catalogo) {
    const existente = actuales.find(insumo => normalize(insumo.nombre) === normalize(item.nombre));

    if (existente) {
      await prisma.insumo.update({
        where: { id: existente.id },
        data: { ...item, estado: 'Activo' }
      });
      usados.add(existente.id);
      await vincularProveedores(item, existente.id, proveedorMap);
    } else {
      const creado = await prisma.insumo.create({
        data: { ...item, estado: 'Activo' }
      });
      usados.add(creado.id);
      await vincularProveedores(item, creado.id, proveedorMap);
    }
  }

  for (const insumo of actuales) {
    if (!usados.has(insumo.id)) {
      await prisma.insumo.update({
        where: { id: insumo.id },
        data: { estado: 'Inactivo' }
      });
    }
  }

  console.log(`Catálogo limpio: ${catalogo.length} insumos activos con precios estimados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
