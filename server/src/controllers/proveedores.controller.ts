import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProveedores = async (req: Request, res: Response) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      where: { estado: 'Activo' },
    });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

export const createProveedor = async (req: Request, res: Response) => {
  const { nit_rut, razon_social, telefono } = req.body;
  try {
    const exist = await prisma.proveedor.findFirst({
      where: {
        OR: [{ nit_rut }, { razon_social }]
      }
    });

    if (exist) {
      return res.status(400).json({ error: 'Proveedor ya registrado' });
    }

    const nuevo = await prisma.proveedor.create({
      data: { nit_rut, razon_social, telefono, estado: 'Activo' }
    });
    
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

export const editProveedor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { nit_rut, razon_social, telefono } = req.body;
  try {
    const exist = await prisma.proveedor.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [{ nit_rut }, { razon_social }] }
        ]
      }
    });

    if (exist) {
      return res.status(400).json({ error: 'Proveedor ya registrado' });
    }

    const actualizado = await prisma.proveedor.update({
      where: { id },
      data: { nit_rut, razon_social, telefono }
    });
    
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

export const deleteProveedor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.proveedor.update({
      where: { id },
      data: { estado: 'Inactivo' }
    });
    res.status(200).json({ message: 'Proveedor eliminado correctamente (borrado lógico)' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};
