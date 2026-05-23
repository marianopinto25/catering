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

  const clienteUser = await prisma.usuario.upsert({
    where: { email: 'cliente@catering.com' },
    update: {},
    create: {
      email: 'cliente@catering.com',
      password_hash: '123456',
      nombre: 'Cliente Obra',
      rol: 'Cliente',
    },
  });

  const almacen = await prisma.usuario.upsert({
    where: { email: 'almacen@catering.com' },
    update: {},
    create: {
      email: 'almacen@catering.com',
      password_hash: '123456',
      nombre: 'Responsable Almacén',
      rol: 'Almacen',
    },
  });

  const cliente = await prisma.cliente.upsert({
    where: { razon_social: 'Obra Central S.A.' },
    update: { estado: 'Activo' },
    create: {
      razon_social: 'Obra Central S.A.',
      estado: 'Activo',
    },
  });

  await prisma.trabajador.upsert({
    where: { ci: '1234567' },
    update: {
      cliente_id: cliente.id,
      codigo_qr: 'QR-1234567',
      nombres: 'Juan',
      apellidos: 'Perez',
      estado: 'Activo',
    },
    create: {
      cliente_id: cliente.id,
      ci: '1234567',
      codigo_qr: 'QR-1234567',
      nombres: 'Juan',
      apellidos: 'Perez',
      estado: 'Activo',
    },
  });

  await prisma.trabajador.upsert({
    where: { ci: '7654321' },
    update: {
      cliente_id: cliente.id,
      codigo_qr: 'QR-7654321',
      nombres: 'Maria',
      apellidos: 'Rojas',
      estado: 'Activo',
    },
    create: {
      cliente_id: cliente.id,
      ci: '7654321',
      codigo_qr: 'QR-7654321',
      nombres: 'Maria',
      apellidos: 'Rojas',
      estado: 'Activo',
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
    where: { nombre_marca: { nombre: 'Arroz', marca: 'Genérica' } },
    update: {},
    create: {
      nombre: 'Arroz',
      marca: 'Genérica',
      unidad_medida: 'Kg',
      categoria: 'Abarrotes',
      stock_minimo: 10,
      estado: 'Activo',
    },
  });

  const pollo = await prisma.insumo.upsert({
    where: { nombre_marca: { nombre: 'Pollo', marca: 'Genérica' } },
    update: {},
    create: {
      nombre: 'Pollo',
      marca: 'Genérica',
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

  const desayuno = await prisma.plato.upsert({
    where: { nombre: 'Avena con frutas' },
    update: { descripcion: 'Desayuno base con cereal y fruta' },
    create: {
      nombre: 'Avena con frutas',
      descripcion: 'Desayuno base con cereal y fruta',
      estado: 'Activo',
    },
  });

  const cena = await prisma.plato.upsert({
    where: { nombre: 'Sopa de verduras' },
    update: { descripcion: 'Cena ligera para servicio nocturno' },
    create: {
      nombre: 'Sopa de verduras',
      descripcion: 'Cena ligera para servicio nocturno',
      estado: 'Activo',
    },
  });

  await prisma.menuItem.upsert({
    where: {
      menu_mes_id_semana_dia_turno: {
        menu_mes_id: menu.id,
        semana: 1,
        dia: 'Lunes',
        turno: 'Desayuno',
      },
    },
    update: {
      plato_id: desayuno.id,
      porciones_estimadas: 80,
    },
    create: {
      menu_mes_id: menu.id,
      semana: 1,
      dia: 'Lunes',
      turno: 'Desayuno',
      plato_id: desayuno.id,
      porciones_estimadas: 80,
    },
  });

  await prisma.menuItem.upsert({
    where: {
      menu_mes_id_semana_dia_turno: {
        menu_mes_id: menu.id,
        semana: 1,
        dia: 'Lunes',
        turno: 'Cena',
      },
    },
    update: {
      plato_id: cena.id,
      porciones_estimadas: 90,
    },
    create: {
      menu_mes_id: menu.id,
      semana: 1,
      dia: 'Lunes',
      turno: 'Cena',
      plato_id: cena.id,
      porciones_estimadas: 90,
    },
  });

  console.log('Seed ejecutado correctamente:', { gerente, clienteUser, almacen, cliente, proveedor, plato, desayuno, cena, menu });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
