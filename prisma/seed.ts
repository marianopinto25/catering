import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const gerente = await prisma.usuario.upsert({
    where: { email: 'gerente@catering.com' },
    update: { rol: 'GERENTE', nombre: 'Gerente General' },
    create: {
      email: 'gerente@catering.com',
      password_hash: '123456', // Mock password simple
      nombre: 'Gerente General',
      rol: 'GERENTE',
    },
  });

  const chef = await prisma.usuario.upsert({
    where: { email: 'chef@catering.com' },
    update: { rol: 'CHEF', nombre: 'Chef Principal' },
    create: {
      email: 'chef@catering.com',
      password_hash: '123456',
      nombre: 'Chef Principal',
      rol: 'CHEF',
    },
  });

  const clienteUser = await prisma.usuario.upsert({
    where: { email: 'cliente@catering.com' },
    update: { rol: 'CLIENTE', nombre: 'Cliente Obra' },
    create: {
      email: 'cliente@catering.com',
      password_hash: '123456',
      nombre: 'Cliente Obra',
      rol: 'CLIENTE',
    },
  });

  const almacen = await prisma.usuario.upsert({
    where: { email: 'almacen@catering.com' },
    update: { rol: 'ALMACEN', nombre: 'Responsable Almacén' },
    create: {
      email: 'almacen@catering.com',
      password_hash: '123456',
      nombre: 'Responsable Almacén',
      rol: 'ALMACEN',
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

  const trabajadorUser1 = await prisma.usuario.upsert({
    where: { email: 'trabajador1@cliente.com' },
    update: { rol: 'TRABAJADOR', nombre: 'Juan Perez' },
    create: {
      email: 'trabajador1@cliente.com',
      password_hash: '123456',
      nombre: 'Juan Perez',
      rol: 'TRABAJADOR',
    },
  });

  const trabajadorUser2 = await prisma.usuario.upsert({
    where: { email: 'trabajador2@cliente.com' },
    update: { rol: 'TRABAJADOR', nombre: 'Maria Rojas' },
    create: {
      email: 'trabajador2@cliente.com',
      password_hash: '123456',
      nombre: 'Maria Rojas',
      rol: 'TRABAJADOR',
    },
  });

  const qr1 = `TRB-1-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const qr2 = `TRB-2-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  await prisma.trabajador.upsert({
    where: { ci: '1234567' },
    update: {
      cliente_id: cliente.id,
      codigo_qr: 'TRB-1-DEMO',
      nombres: 'Juan',
      apellidos: 'Perez',
      nombre: 'Juan Perez',
      cliente_empresa: cliente.razon_social,
      activo: true,
      estado: 'Activo',
      usuarioId: trabajadorUser1.id,
    },
    create: {
      cliente_id: cliente.id,
      ci: '1234567',
      codigo_qr: qr1,
      nombres: 'Juan',
      apellidos: 'Perez',
      nombre: 'Juan Perez',
      cliente_empresa: cliente.razon_social,
      activo: true,
      estado: 'Activo',
      usuarioId: trabajadorUser1.id,
    },
  });

  await prisma.trabajador.upsert({
    where: { ci: '7654321' },
    update: {
      cliente_id: cliente.id,
      codigo_qr: 'TRB-2-DEMO',
      nombres: 'Maria',
      apellidos: 'Rojas',
      nombre: 'Maria Rojas',
      cliente_empresa: cliente.razon_social,
      activo: true,
      estado: 'Activo',
      usuarioId: trabajadorUser2.id,
    },
    create: {
      cliente_id: cliente.id,
      ci: '7654321',
      codigo_qr: qr2,
      nombres: 'Maria',
      apellidos: 'Rojas',
      nombre: 'Maria Rojas',
      cliente_empresa: cliente.razon_social,
      activo: true,
      estado: 'Activo',
      usuarioId: trabajadorUser2.id,
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

  await prisma.proveedorInsumo.upsert({
    where: { proveedor_id_insumo_id: { proveedor_id: proveedor.id, insumo_id: arroz.id } },
    update: { precio_unitario: 7, es_preferido: true, estado: 'Activo' },
    create: {
      proveedor_id: proveedor.id,
      insumo_id: arroz.id,
      precio_unitario: 7,
      es_preferido: true,
      estado: 'Activo',
    },
  });

  await prisma.proveedorInsumo.upsert({
    where: { proveedor_id_insumo_id: { proveedor_id: proveedor.id, insumo_id: pollo.id } },
    update: { precio_unitario: 18, es_preferido: true, estado: 'Activo' },
    create: {
      proveedor_id: proveedor.id,
      insumo_id: pollo.id,
      precio_unitario: 18,
      es_preferido: true,
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

  console.log('Seed ejecutado correctamente:', { gerente, chef, clienteUser, almacen, trabajadorUser1, trabajadorUser2, cliente, proveedor, plato, desayuno, cena, menu });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
