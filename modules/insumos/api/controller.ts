import { Request, Response } from 'express';
import { prisma } from '../../../core/api/prisma';

/**
 * CU-06: Editar información de insumos y Catálogo Maestro
 */
export const getInsumos = async (req: Request, res: Response) => {
  try {
    const insumos = await prisma.insumo.findMany({
      where: { estado: 'Activo' },
      include: {
        proveedores: {
          where: { estado: 'Activo' },
          include: { proveedor: { select: { id: true, razon_social: true } } },
          orderBy: [{ es_preferido: 'desc' }, { precio_unitario: 'asc' }]
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(insumos.map(insumo => {
      const proveedoresDisponibles = insumo.proveedores.map(rel => ({
        id: rel.proveedor.id,
        razon_social: rel.proveedor.razon_social,
        precio_unitario: rel.precio_unitario,
        es_preferido: rel.es_preferido
      }));
      const preferred = proveedoresDisponibles.find(rel => rel.es_preferido) || proveedoresDisponibles[0];
      return {
        ...insumo,
        proveedores: undefined,
        proveedores_disponibles: proveedoresDisponibles,
        proveedor_preferido: preferred || null
      };
    }));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener catálogo de insumos' });
  }
};

export const createInsumo = async (req: Request, res: Response) => {
  const { nombre, marca, unidad_medida, categoria, stock_minimo, precio_unitario } = req.body;
  const marcaFinal = String(marca || 'Genérica').trim();
  const stock = Number(stock_minimo);
  const precio = Number(precio_unitario);
  try {
    if (!nombre || !marcaFinal || !unidad_medida || !categoria) {
      return res.status(400).json({ error: 'Nombre, marca, unidad y categoría son obligatorios' });
    }
    if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: 'Stock mínimo inválido' });
    if (!Number.isFinite(precio) || precio <= 0) return res.status(400).json({ error: 'Precio unitario debe ser mayor a 0' });

    const existe = await prisma.insumo.findUnique({ where: { nombre_marca: { nombre, marca: marcaFinal } } });
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un insumo con ese nombre y marca' });
    }

    const insumo = await prisma.insumo.create({
      data: {
        nombre,
        marca: marcaFinal,
        unidad_medida,
        categoria,
        stock_minimo: stock,
        precio_unitario: precio
      }
    });
    res.status(201).json(insumo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear insumo' });
  }
};

export const updateInsumo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, marca, unidad_medida, categoria, stock_minimo, precio_unitario } = req.body;
  const marcaFinal = String(marca || 'Genérica').trim();
  const stock = Number(stock_minimo);
  const precio = Number(precio_unitario);
  try {
    if (!nombre || !marcaFinal || !unidad_medida || !categoria) {
      return res.status(400).json({ error: 'Nombre, marca, unidad y categoría son obligatorios' });
    }
    if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: 'Stock mínimo inválido' });
    if (!Number.isFinite(precio) || precio <= 0) return res.status(400).json({ error: 'Precio unitario debe ser mayor a 0' });

    const existe = await prisma.insumo.findUnique({ where: { nombre_marca: { nombre, marca: marcaFinal } } });
    if (existe && existe.id !== Number(id)) {
      return res.status(400).json({ error: 'Ya existe otro insumo con ese nombre y marca' });
    }

    const insumo = await prisma.insumo.update({
      where: { id: Number(id) },
      data: {
        nombre,
        marca: marcaFinal,
        unidad_medida,
        categoria,
        stock_minimo: stock,
        precio_unitario: precio
      }
    });
    res.json(insumo);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar insumo' });
  }
};

export const deleteInsumo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.insumo.update({
      where: { id: Number(id) },
      data: { estado: 'Inactivo' }
    });
    res.json({ message: 'Insumo eliminado (Inactivo)' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar insumo' });
  }
};
