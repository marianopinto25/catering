import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const insumos = [
  ['Papa', 'Kg', 'Verduras', 8],
  ['Cebolla', 'Kg', 'Verduras', 5],
  ['Zanahoria', 'Kg', 'Verduras', 5],
  ['Tomate', 'Kg', 'Verduras', 5],
  ['Lechuga', 'Kg', 'Verduras', 3],
  ['Huevo', 'Unidad', 'Proteínas', 30],
  ['Carne de res', 'Kg', 'Carnes', 6],
  ['Atún', 'Lata', 'Proteínas', 20],
  ['Avena', 'Kg', 'Abarrotes', 4],
  ['banana', 'Kg', 'Frutas', 6],
  ['Yogurt', 'L', 'Lácteos', 4],
  ['Granola', 'Kg', 'Abarrotes', 3],
  ['Pan', 'Unidad', 'Panadería', 80],
  ['Queso', 'Kg', 'Lácteos', 4],
  ['Mermelada', 'Kg', 'Abarrotes', 3],
  ['Té', 'Kg', 'Bebidas', 1],
  ['Café', 'Kg', 'Bebidas', 2],
  ['Jugo de fruta', 'L', 'Bebidas', 20],
  ['Azúcar', 'Kg', 'Abarrotes', 5],
  ['Fideo', 'Kg', 'Abarrotes', 6],
  ['Zapallo', 'Kg', 'Verduras', 6],
  ['Verduras mixtas', 'Kg', 'Verduras', 8],
  ['Aceite', 'L', 'Abarrotes', 5],
  ['Harina', 'Kg', 'Abarrotes', 5]
] as const;

const recetaByPlato: Record<string, Array<[string, number]>> = {
  'Arroz con pollo': [['Arroz', 0.12], ['Pollo', 0.18], ['Cebolla', 0.03], ['Zanahoria', 0.04], ['Aceite', 0.01]],
  'Avena con frutas': [['Avena', 0.06], ['banana', 0.08], ['leche', 0.18], ['Azúcar', 0.01]],
  'Sopa de verduras': [['Papa', 0.08], ['Zanahoria', 0.05], ['Cebolla', 0.02], ['Verduras mixtas', 0.08]],
  'Pan integral con huevo revuelto': [['Pan', 1], ['Huevo', 1], ['Aceite', 0.01]],
  'Fideo con carne y ensalada': [['Fideo', 0.11], ['Carne de res', 0.16], ['Lechuga', 0.04], ['Tomate', 0.05]],
  'Crema de zapallo': [['Zapallo', 0.16], ['leche', 0.08], ['Cebolla', 0.02]],
  'Yogurt con granola': [['Yogurt', 0.2], ['Granola', 0.06], ['banana', 0.05]],
  'Majadito de pollo': [['Arroz', 0.12], ['Pollo', 0.16], ['Tomate', 0.04], ['Cebolla', 0.03]],
  'Ensalada de atún': [['Atún', 0.5], ['Lechuga', 0.08], ['Tomate', 0.05], ['Cebolla', 0.02]],
  'Tostadas con mermelada y té': [['Pan', 2], ['Mermelada', 0.03], ['Té', 0.005], ['Azúcar', 0.01]],
  'Picante de pollo con arroz': [['Pollo', 0.18], ['Arroz', 0.1], ['Papa', 0.12], ['Cebolla', 0.04]],
  'Sándwich de pollo': [['Pan', 2], ['Pollo', 0.12], ['Lechuga', 0.04], ['Tomate', 0.04]],
  'Batido de banana': [['banana', 0.14], ['leche', 0.2], ['Azúcar', 0.01]],
  'Milanesa con puré': [['Carne de res', 0.18], ['Papa', 0.2], ['Huevo', 0.5], ['Harina', 0.03]],
  'Sopa de pollo': [['Pollo', 0.12], ['Papa', 0.08], ['Zanahoria', 0.05], ['Cebolla', 0.02]],
  'Empanadas al horno': [['Harina', 0.09], ['Carne de res', 0.08], ['Cebolla', 0.03], ['Huevo', 0.25]],
  'Silpancho (versión catering)': [['Carne de res', 0.17], ['Arroz', 0.1], ['Papa', 0.16], ['Huevo', 1], ['Tomate', 0.04]],
  'Ensalada mixta con pollo': [['Pollo', 0.12], ['Lechuga', 0.08], ['Tomate', 0.05], ['Zanahoria', 0.05]],
  'Pollo al horno con arroz': [['Pollo', 0.2], ['Arroz', 0.12], ['Papa', 0.12], ['Cebolla', 0.03]],
  'Sopa ligera de verduras': [['Verduras mixtas', 0.12], ['Papa', 0.06], ['Zanahoria', 0.04]],
  'Queque + café': [['Harina', 0.06], ['Huevo', 0.5], ['Azúcar', 0.04], ['Café', 0.006]],
  'Té': [['Té', 0.005], ['Azúcar', 0.01]],
  'Café': [['Café', 0.006], ['Azúcar', 0.01]],
  'Jugo natural': [['Jugo de fruta', 0.25], ['Azúcar', 0.01]],
  'Sopa del día': [['Papa', 0.07], ['Zanahoria', 0.04], ['Cebolla', 0.02], ['Verduras mixtas', 0.08]]
};

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const bebidas = ['Té', 'Café', 'Jugo natural'];

async function upsertInsumo(nombre: string, unidad_medida: string, categoria: string, stock_minimo: number) {
  const existentes = await prisma.insumo.findMany({ where: { estado: 'Activo' } });
  const existente = existentes.find(item => item.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());
  if (existente) {
    return prisma.insumo.update({
      where: { id: existente.id },
      data: { unidad_medida, categoria, stock_minimo, estado: 'Activo' }
    });
  }

  return prisma.insumo.create({
    data: { nombre, marca: 'Genérica', unidad_medida, categoria, stock_minimo, estado: 'Activo' }
  });
}

async function upsertPlato(nombre: string) {
  return prisma.plato.upsert({
    where: { nombre },
    update: { estado: 'Activo' },
    create: { nombre, descripcion: 'Plato operativo de menú mensual', estado: 'Activo' }
  });
}

async function main() {
  const insumoMap = new Map<string, { id: number; unidad_medida: string }>();
  for (const [nombre, unidad, categoria, minimo] of insumos) {
    const insumo = await upsertInsumo(nombre, unidad, categoria, minimo);
    insumoMap.set(nombre.toLowerCase(), { id: insumo.id, unidad_medida: insumo.unidad_medida });
  }

  for (const [platoNombre, receta] of Object.entries(recetaByPlato)) {
    const plato = await upsertPlato(platoNombre);
    for (const [insumoNombre, cantidad] of receta) {
      const insumo = insumoMap.get(insumoNombre.toLowerCase());
      if (!insumo) continue;
      await prisma.platoInsumo.upsert({
        where: { plato_id_insumo_id: { plato_id: plato.id, insumo_id: insumo.id } },
        update: { cantidad_por_porcion: cantidad, unidad_medida: insumo.unidad_medida },
        create: {
          plato_id: plato.id,
          insumo_id: insumo.id,
          cantidad_por_porcion: cantidad,
          unidad_medida: insumo.unidad_medida
        }
      });
    }
  }

  const menu = await prisma.menuMes.upsert({
    where: { anio_mes: { anio: 2026, mes: 5 } },
    update: { estado: 'BORRADOR' },
    create: { anio: 2026, mes: 5, estado: 'BORRADOR' }
  });

  const sopa = await upsertPlato('Sopa del día');
  for (const semana of [1, 2, 3, 4]) {
    for (const [index, dia] of dias.entries()) {
      const bebida = await upsertPlato(bebidas[(index + semana) % bebidas.length]);
      await prisma.menuItem.upsert({
        where: { menu_mes_id_semana_dia_turno: { menu_mes_id: menu.id, semana, dia, turno: 'Desayuno - Bebida' } },
        update: { plato_id: bebida.id, porciones_estimadas: 80 },
        create: { menu_mes_id: menu.id, semana, dia, turno: 'Desayuno - Bebida', plato_id: bebida.id, porciones_estimadas: 80 }
      });

      await prisma.menuItem.upsert({
        where: { menu_mes_id_semana_dia_turno: { menu_mes_id: menu.id, semana, dia, turno: 'Almuerzo - Sopa' } },
        update: { plato_id: sopa.id, porciones_estimadas: 120 },
        create: { menu_mes_id: menu.id, semana, dia, turno: 'Almuerzo - Sopa', plato_id: sopa.id, porciones_estimadas: 120 }
      });
    }
  }

  console.log('Menú enriquecido con insumos, bebidas y sopas.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
