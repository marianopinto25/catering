"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientes = exports.updateTrabajador = exports.createTrabajador = exports.getTrabajadores = void 0;
const prisma_1 = require("../../../core/api/prisma");
const canReadTrabajadores = (rol) => rol === 'Gerente' || rol === 'Cliente';
const getTrabajadores = async (req, res) => {
    if (!canReadTrabajadores(req.user?.rol))
        return res.status(403).json({ error: 'Acceso denegado' });
    const ci = String(req.query.ci || '').trim();
    const qr = String(req.query.qr || '').trim();
    try {
        if (ci || qr) {
            const trabajador = await prisma_1.prisma.trabajador.findFirst({
                where: {
                    estado: 'Activo',
                    OR: [
                        ...(ci ? [{ ci }] : []),
                        ...(qr ? [{ codigo_qr: qr }] : [])
                    ]
                },
                include: { cliente: true }
            });
            if (!trabajador) {
                return res.status(404).json({ error: 'Trabajador no registrado', accion: 'registrar_trabajador' });
            }
            return res.json(trabajador);
        }
        const trabajadores = await prisma_1.prisma.trabajador.findMany({
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
            include: { cliente: true }
        });
        res.json(trabajadores);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener trabajadores' });
    }
};
exports.getTrabajadores = getTrabajadores;
const createTrabajador = async (req, res) => {
    if (req.user?.rol !== 'Gerente')
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    const { ci, codigo_qr, nombres, apellidos, cliente_id, estado } = req.body;
    const cleanCi = String(ci || '').trim();
    const cleanQr = String(codigo_qr || '').trim();
    try {
        if (!cleanCi || !nombres || !apellidos || !cliente_id) {
            return res.status(400).json({ error: 'CI, nombres, apellidos y cliente son obligatorios' });
        }
        const exists = await prisma_1.prisma.trabajador.findFirst({
            where: {
                OR: [
                    { ci: cleanCi },
                    ...(cleanQr ? [{ codigo_qr: cleanQr }] : [])
                ]
            }
        });
        if (exists)
            return res.status(400).json({ error: 'Trabajador ya registrado' });
        const trabajador = await prisma_1.prisma.trabajador.create({
            data: {
                ci: cleanCi,
                codigo_qr: cleanQr || null,
                nombres: String(nombres).trim(),
                apellidos: String(apellidos).trim(),
                cliente_id: Number(cliente_id),
                estado: estado === 'Inactivo' ? 'Inactivo' : 'Activo'
            },
            include: { cliente: true }
        });
        res.status(201).json(trabajador);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear trabajador' });
    }
};
exports.createTrabajador = createTrabajador;
const updateTrabajador = async (req, res) => {
    if (req.user?.rol !== 'Gerente')
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    const id = Number(req.params.id);
    const { ci, codigo_qr, nombres, apellidos, cliente_id, estado } = req.body;
    const cleanCi = String(ci || '').trim();
    const cleanQr = String(codigo_qr || '').trim();
    try {
        if (!Number.isInteger(id) || id <= 0)
            return res.status(400).json({ error: 'ID inválido' });
        if (!cleanCi || !nombres || !apellidos || !cliente_id) {
            return res.status(400).json({ error: 'CI, nombres, apellidos y cliente son obligatorios' });
        }
        const exists = await prisma_1.prisma.trabajador.findFirst({
            where: {
                id: { not: id },
                OR: [
                    { ci: cleanCi },
                    ...(cleanQr ? [{ codigo_qr: cleanQr }] : [])
                ]
            }
        });
        if (exists)
            return res.status(400).json({ error: 'Trabajador ya registrado' });
        const trabajador = await prisma_1.prisma.trabajador.update({
            where: { id },
            data: {
                ci: cleanCi,
                codigo_qr: cleanQr || null,
                nombres: String(nombres).trim(),
                apellidos: String(apellidos).trim(),
                cliente_id: Number(cliente_id),
                estado: estado === 'Inactivo' ? 'Inactivo' : 'Activo'
            },
            include: { cliente: true }
        });
        res.json(trabajador);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar trabajador' });
    }
};
exports.updateTrabajador = updateTrabajador;
const getClientes = async (req, res) => {
    if (req.user?.rol !== 'Gerente')
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    try {
        const clientes = await prisma_1.prisma.cliente.findMany({
            where: { estado: 'Activo' },
            orderBy: { razon_social: 'asc' }
        });
        res.json(clientes);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};
exports.getClientes = getClientes;
