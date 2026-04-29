"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInsumo = exports.updateInsumo = exports.createInsumo = exports.getInsumos = void 0;
const prisma_1 = require("../../../core/api/prisma");
/**
 * CU-06: Editar información de insumos y Catálogo Maestro
 */
const getInsumos = async (req, res) => {
    try {
        const insumos = await prisma_1.prisma.insumo.findMany({
            where: { estado: 'Activo' },
            orderBy: { nombre: 'asc' }
        });
        res.json(insumos);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener catálogo de insumos' });
    }
};
exports.getInsumos = getInsumos;
const createInsumo = async (req, res) => {
    const { nombre, unidad_medida, categoria, stock_minimo } = req.body;
    try {
        const existe = await prisma_1.prisma.insumo.findUnique({ where: { nombre } });
        if (existe) {
            return res.status(400).json({ error: 'Insumo ya registrado' });
        }
        const insumo = await prisma_1.prisma.insumo.create({
            data: { nombre, unidad_medida, categoria, stock_minimo: Number(stock_minimo) }
        });
        res.status(201).json(insumo);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear insumo' });
    }
};
exports.createInsumo = createInsumo;
const updateInsumo = async (req, res) => {
    const { id } = req.params;
    const { nombre, unidad_medida, categoria, stock_minimo } = req.body;
    try {
        const insumo = await prisma_1.prisma.insumo.update({
            where: { id: Number(id) },
            data: { nombre, unidad_medida, categoria, stock_minimo: Number(stock_minimo) }
        });
        res.json(insumo);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar insumo' });
    }
};
exports.updateInsumo = updateInsumo;
const deleteInsumo = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.prisma.insumo.update({
            where: { id: Number(id) },
            data: { estado: 'Inactivo' }
        });
        res.json({ message: 'Insumo eliminado (Inactivo)' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar insumo' });
    }
};
exports.deleteInsumo = deleteInsumo;
