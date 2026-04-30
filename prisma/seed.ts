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

  console.log('Seed ejecutado correctamente:', { gerente, proveedor });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
