import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || 'file:./dev.db' } } });

/**
 * CU-06: Editar información de insumos y Catálogo Maestro
 */
export const getInsumos = async (req: Request, res: Response) => {
  try {
    const insumos = await prisma.insumo.findMany({
      where: { estado: 'Activo' },
      orderBy: { nombre: 'asc' }
    });
    res.json(insumos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener catálogo de insumos' });
  }
};

export const createInsumo = async (req: Request, res: Response) => {
  const { nombre, unidad_medida, categoria, stock_minimo } = req.body;
  try {
    const existe = await prisma.insumo.findUnique({ where: { nombre } });
    if (existe) {
      return res.status(400).json({ error: 'Insumo ya registrado' });
    }

    const insumo = await prisma.insumo.create({
      data: { nombre, unidad_medida, categoria, stock_minimo: Number(stock_minimo) }
    });
    res.status(201).json(insumo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear insumo' });
  }
};

export const updateInsumo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, unidad_medida, categoria, stock_minimo } = req.body;
  try {
    const insumo = await prisma.insumo.update({
      where: { id: Number(id) },
      data: { nombre, unidad_medida, categoria, stock_minimo: Number(stock_minimo) }
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
