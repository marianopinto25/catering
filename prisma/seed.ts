import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const gerente = await prisma.usuario.upsert({
    where: { email: 'gerente@catering.com' },
    update: {},
    create: {
      email: 'gerente@catering.com',
      password_hash: '123456', // Mock password simple
      nombre: 'Gerente General',
      rol: 'Gerente',
    },
  });

  const proveedor = await prisma.proveedor.upsert({
    where: { nit_rut: '12345678-9' },
    update: {
      responsable_nombre: 'María López',
      responsable_cargo: 'Ejecutiva comercial',
      responsable_telefono: '+12345678',
      responsable_email: 'maria.lopez@proveedor-lacteos.test',
    },
    create: {
      nit_rut: '12345678-9',
      razon_social: 'Proveedor de Lácteos S.A.',
      telefono: '+12345678',
      responsable_nombre: 'María López',
      responsable_cargo: 'Ejecutiva comercial',
      responsable_telefono: '+12345678',
      responsable_email: 'maria.lopez@proveedor-lacteos.test',
      estado: 'Activo',
    },
  });

  const arroz = await prisma.insumo.upsert({
    where: { nombre: 'Arroz' },
    update: {},
    create: {
      nombre: 'Arroz',
      unidad_medida: 'Kg',
      categoria: 'Abarrotes',
      stock_minimo: 10,
      estado: 'Activo',
    },
  });

  const pollo = await prisma.insumo.upsert({
    where: { nombre: 'Pollo' },
    update: {},
    create: {
      nombre: 'Pollo',
      unidad_medida: 'Kg',
      categoria: 'Carnes',
      stock_minimo: 8,
      estado: 'Activo',
    },
  });

  const plato = await prisma.plato.upsert({
    where: { nombre: 'Arroz con pollo' },
    update: { descripcion: 'Plato base de almuerzo corporativo' },
    create: {
      nombre: 'Arroz con pollo',
      descripcion: 'Plato base de almuerzo corporativo',
      estado: 'Activo',
    },
  });

  await prisma.platoInsumo.upsert({
    where: { plato_id_insumo_id: { plato_id: plato.id, insumo_id: arroz.id } },
    update: { cantidad_por_porcion: 0.12, unidad_medida: 'Kg' },
    create: {
      plato_id: plato.id,
      insumo_id: arroz.id,
      cantidad_por_porcion: 0.12,
      unidad_medida: 'Kg',
    },
  });

  await prisma.platoInsumo.upsert({
    where: { plato_id_insumo_id: { plato_id: plato.id, insumo_id: pollo.id } },
    update: { cantidad_por_porcion: 0.18, unidad_medida: 'Kg' },
    create: {
      plato_id: plato.id,
      insumo_id: pollo.id,
      cantidad_por_porcion: 0.18,
      unidad_medida: 'Kg',
    },
  });

  const menu = await prisma.menuMes.upsert({
    where: { anio_mes: { anio: 2026, mes: 4 } },
    update: {},
    create: {
      anio: 2026,
      mes: 4,
      estado: 'BORRADOR',
    },
  });

  await prisma.menuItem.upsert({
    where: {
      menu_mes_id_semana_dia_turno: {
        menu_mes_id: menu.id,
        semana: 1,
        dia: 'Lunes',
        turno: 'Almuerzo',
      },
    },
    update: {
      plato_id: plato.id,
      porciones_estimadas: 120,
    },
    create: {
      menu_mes_id: menu.id,
      semana: 1,
      dia: 'Lunes',
      turno: 'Almuerzo',
      plato_id: plato.id,
      porciones_estimadas: 120,
    },
  });

  console.log('Seed ejecutado correctamente:', { gerente, proveedor, plato, menu });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
