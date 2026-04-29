"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProveedor = exports.editProveedor = exports.createProveedor = exports.getProveedores = void 0;
const prisma_1 = require("../../../core/api/prisma");
const getProveedores = async (req, res) => {
    try {
        const proveedores = await prisma_1.prisma.proveedor.findMany({
            where: { estado: 'Activo' },
        });
        res.json(proveedores);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
};
exports.getProveedores = getProveedores;
const createProveedor = async (req, res) => {
    const { nit_rut, razon_social, telefono } = req.body;
    try {
        const exist = await prisma_1.prisma.proveedor.findFirst({
            where: {
                OR: [{ nit_rut }, { razon_social }]
            }
        });
        if (exist) {
            return res.status(400).json({ error: 'Proveedor ya registrado' });
        }
        const nuevo = await prisma_1.prisma.proveedor.create({
            data: { nit_rut, razon_social, telefono, estado: 'Activo' }
        });
        res.status(201).json(nuevo);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear proveedor' });
    }
};
exports.createProveedor = createProveedor;
const editProveedor = async (req, res) => {
    const id = Number(req.params.id);
    const { nit_rut, razon_social, telefono } = req.body;
    try {
        const exist = await prisma_1.prisma.proveedor.findFirst({
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
        const actualizado = await prisma_1.prisma.proveedor.update({
            where: { id },
            data: { nit_rut, razon_social, telefono }
        });
        res.json(actualizado);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
};
exports.editProveedor = editProveedor;
const deleteProveedor = async (req, res) => {
    const id = Number(req.params.id);
    try {
        await prisma_1.prisma.proveedor.update({
            where: { id },
            data: { estado: 'Inactivo' }
        });
        res.status(200).json({ message: 'Proveedor eliminado correctamente (borrado lógico)' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
};
exports.deleteProveedor = deleteProveedor;
