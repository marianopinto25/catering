import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Requerido = {
  insumo_id: number;
  nombre: string;
  unidad_medida: string;
  categoria: string;
  requerido: number;
};

const roundQty = (value: number, unidad: string) => {
  if (['unidad', 'lata'].includes(unidad.toLowerCase())) return Math.max(1, Math.round(value));
  return Number(value.toFixed(2));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const vidaUtilDias = (item: Requerido) => {
  const text = `${item.nombre} ${item.categoria}`.toLowerCase();
  if (/pollo|carne|res|pescado|cerdo|at[uú]n/.test(text)) return 3;
  if (/huevo/.test(text)) return 21;
  if (/leche|yogurt/.test(text)) return 6;
  if (/queso/.test(text)) return 12;
  if (/banana|lechuga/.test(text)) return 5;
  if (/tomate|verdura|papa|cebolla|zanahoria|zapallo/.test(text)) return 9;
  if (/pan/.test(text)) return 3;
  if (/agua|aceite/.test(text)) return 100;
  return 80;
};

async function limpiarComprasInventario() {
  await prisma.movimientoInventario.deleteMany();
  await prisma.inventario.deleteMany();
  await prisma.compraDetalle.deleteMany();
  await prisma.compra.deleteMany();
}

async function calcularRequeridos() {
  const menu = await prisma.menuMes.findUnique({
    where: { anio_mes: { anio: 2026, mes: 5 } },
    include: {
      items: {
        where: { semana: 1 },
        include: {
          plato: {
            include: {
              receta: {
                include: { insumo: true }
              }
            }
          }
        }
      }
    }
  });

  if (!menu || menu.items.length === 0) {
    throw new Error('No existe menú de mayo 2026 semana 1 para generar la demo.');
  }

  const requeridos = new Map<number, Requerido>();
  for (const item of menu.items) {
    for (const receta of item.plato.receta) {
      if (receta.insumo.estado !== 'Activo') continue;
      const actual = requeridos.get(receta.insumo_id) || {
        insumo_id: receta.insumo_id,
        nombre: receta.insumo.nombre,
        unidad_medida: receta.insumo.unidad_medida,
        categoria: receta.insumo.categoria,
        requerido: 0
      };
      actual.requerido += Number(receta.cantidad_por_porcion) * item.porciones_estimadas;
      requeridos.set(receta.insumo_id, actual);
    }
  }

  return Array.from(requeridos.values())
    .filter(item => item.requerido > 0)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function getProveedorPreferido(insumoId: number) {
  const relacion = await prisma.proveedorInsumo.findFirst({
    where: { insumo_id: insumoId, estado: 'Activo' },
    orderBy: [{ es_preferido: 'desc' }, { precio_unitario: 'asc' }]
  });

  if (!relacion) throw new Error(`Insumo ${insumoId} no tiene proveedor configurado.`);
  return relacion;
}

async function crearCompraConInventario(
  usuarioId: number,
  fecha: Date,
  items: Array<{ requerido: Requerido; cantidad: number; precio_unitario: number; proveedor_id: number }>
) {
  const porProveedor = new Map<number, typeof items>();
  for (const item of items) {
    const current = porProveedor.get(item.proveedor_id) || [];
    current.push(item);
    porProveedor.set(item.proveedor_id, current);
  }

  for (const [proveedorId, detalles] of porProveedor.entries()) {
    const total = detalles.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);
    const compra = await prisma.compra.create({
      data: {
        proveedor_id: proveedorId,
        fecha,
        total: Number(total.toFixed(2)),
        estado: 'INGRESADA',
        detalles: {
          create: detalles.map(item => ({
            insumo_id: item.requerido.insumo_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
          }))
        }
      }
    });

    for (const item of detalles) {
      const inventario = await prisma.inventario.create({
        data: {
          insumo_id: item.requerido.insumo_id,
          cantidad_actual: item.cantidad,
          fecha_vencimiento: addDays(fecha, vidaUtilDias(item.requerido)),
          estado: 'Disponible'
        }
      });

      await prisma.movimientoInventario.create({
        data: {
          insumo_id: item.requerido.insumo_id,
          inventario_id: inventario.id,
          tipo_movimiento: 'Ingreso',
          cantidad: item.cantidad,
          fecha,
          motivo: `INGRESO_COMPRA (Compra #${compra.id})`,
          usuario_id: usuarioId
        }
      });
    }
  }
}

async function crearComprasPendientes(
  fecha: Date,
  items: Array<{ requerido: Requerido; cantidad: number; precio_unitario: number; proveedor_id: number }>
) {
  const porProveedor = new Map<number, typeof items>();
  for (const item of items.filter(item => item.cantidad > 0)) {
    const current = porProveedor.get(item.proveedor_id) || [];
    current.push(item);
    porProveedor.set(item.proveedor_id, current);
  }

  for (const [proveedorId, detalles] of porProveedor.entries()) {
    const total = detalles.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);
    await prisma.compra.create({
      data: {
        proveedor_id: proveedorId,
        fecha,
        total: Number(total.toFixed(2)),
        estado: 'PENDIENTE_INGRESO',
        detalles: {
          create: detalles.map(item => ({
            insumo_id: item.requerido.insumo_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
          }))
        }
      }
    });
  }
}

async function main() {
  const usuario = await prisma.usuario.findFirst({ where: { rol: 'Gerente' } });
  if (!usuario) throw new Error('No hay usuario gerente para registrar movimientos.');

  const requeridos = await calcularRequeridos();
  await limpiarComprasInventario();

  const comprasBase = await Promise.all(requeridos.map(async (item) => {
    const proveedor = await getProveedorPreferido(item.insumo_id);
    const inventarioDemo = roundQty(item.requerido * 0.55, item.unidad_medida);
    const pendiente = roundQty(Math.max(0, item.requerido - inventarioDemo), item.unidad_medida);
    return {
      requerido: item,
      inventarioDemo,
      pendiente,
      precio_unitario: proveedor.precio_unitario,
      proveedor_id: proveedor.proveedor_id
    };
  }));

  const waves = [
    { fecha: new Date('2026-05-03T09:15:00'), factor: 0.45 },
    { fecha: new Date('2026-05-06T10:20:00'), factor: 0.35 },
    { fecha: new Date('2026-05-09T08:40:00'), factor: 0.20 }
  ];

  for (const wave of waves) {
    await crearCompraConInventario(
      usuario.id,
      wave.fecha,
      comprasBase.map(item => ({
        requerido: item.requerido,
        cantidad: roundQty(item.inventarioDemo * wave.factor, item.requerido.unidad_medida),
        precio_unitario: item.precio_unitario,
        proveedor_id: item.proveedor_id
      })).filter(item => item.cantidad > 0)
    );
  }

  await crearComprasPendientes(
    new Date('2026-05-10T09:00:00'),
    comprasBase.map(item => ({
      requerido: item.requerido,
      cantidad: item.pendiente,
      precio_unitario: item.precio_unitario,
      proveedor_id: item.proveedor_id
    }))
  );

  console.log(`Demo limpia: ${requeridos.length} insumos del menú, compras e inventario regenerados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
