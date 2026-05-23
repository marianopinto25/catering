"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientes = exports.createCuentaTrabajador = exports.updateTrabajador = exports.createTrabajador = exports.getTrabajadores = void 0;
const prisma_1 = require("../../../core/api/prisma");
const auth_middleware_1 = require("../../../core/api/auth.middleware");
const canReadTrabajadores = (rol) => (0, auth_middleware_1.normalizeRole)(rol) === 'GERENTE';
const buildQrCode = (ci) => `CATERING-${ci.replace(/\W+/g, '').toUpperCase()}`;
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
                include: { cliente: true, usuario: { select: { id: true, email: true, rol: true, nombre: true } } }
            });
            if (!trabajador) {
                return res.status(404).json({ error: 'Trabajador no registrado', accion: 'registrar_trabajador' });
            }
            return res.json(trabajador);
        }
        const trabajadores = await prisma_1.prisma.trabajador.findMany({
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
            include: { cliente: true, usuario: { select: { id: true, email: true, rol: true, nombre: true } } }
        });
        res.json(trabajadores);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener trabajadores' });
    }
};
exports.getTrabajadores = getTrabajadores;
const createTrabajador = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'GERENTE')
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    const { ci, codigo_qr, nombres, apellidos, nombre, cliente_empresa, cliente_id, estado } = req.body;
    const cleanCi = String(ci || '').trim();
    const cleanQr = String(codigo_qr || '').trim() || buildQrCode(cleanCi);
    const fullName = String(nombre || `${nombres || ''} ${apellidos || ''}`).trim();
    try {
        if (!cleanCi || !fullName) {
            return res.status(400).json({ error: 'CI y nombre son obligatorios' });
        }
        const exists = await prisma_1.prisma.trabajador.findFirst({
            where: {
                OR: [
                    { ci: cleanCi },
                    { codigo_qr: cleanQr }
                ]
            }
        });
        if (exists)
            return res.status(400).json({ error: 'Trabajador ya registrado' });
        let clienteId = Number(cliente_id);
        if (!clienteId) {
            const cliente = await prisma_1.prisma.cliente.upsert({
                where: { razon_social: String(cliente_empresa || 'Empresa cliente') },
                update: { estado: 'Activo' },
                create: { razon_social: String(cliente_empresa || 'Empresa cliente'), estado: 'Activo' }
            });
            clienteId = cliente.id;
        }
        const trabajador = await prisma_1.prisma.trabajador.create({
            data: {
                ci: cleanCi,
                codigo_qr: cleanQr,
                nombres: String(nombres || fullName.split(' ')[0] || fullName).trim(),
                apellidos: String(apellidos || fullName.split(' ').slice(1).join(' ') || '').trim(),
                nombre: fullName,
                cliente_empresa: String(cliente_empresa || '').trim(),
                cliente_id: clienteId,
                activo: estado !== 'Inactivo',
                estado: estado === 'Inactivo' ? 'Inactivo' : 'Activo'
            },
            include: { cliente: true, usuario: { select: { id: true, email: true, rol: true, nombre: true } } }
        });
        res.status(201).json(trabajador);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear trabajador' });
    }
};
exports.createTrabajador = createTrabajador;
const updateTrabajador = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'GERENTE')
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    const id = Number(req.params.id);
    const { ci, codigo_qr, nombres, apellidos, nombre, cliente_empresa, cliente_id, estado } = req.body;
    const cleanCi = String(ci || '').trim();
    const cleanQr = String(codigo_qr || '').trim() || buildQrCode(cleanCi);
    const fullName = String(nombre || `${nombres || ''} ${apellidos || ''}`).trim();
    try {
        if (!Number.isInteger(id) || id <= 0)
            return res.status(400).json({ error: 'ID inválido' });
        if (!cleanCi || !fullName) {
            return res.status(400).json({ error: 'CI y nombre son obligatorios' });
        }
        const exists = await prisma_1.prisma.trabajador.findFirst({
            where: {
                id: { not: id },
                OR: [
                    { ci: cleanCi },
                    { codigo_qr: cleanQr }
                ]
            }
        });
        if (exists)
            return res.status(400).json({ error: 'Trabajador ya registrado' });
        let clienteId = Number(cliente_id);
        if (!clienteId) {
            const cliente = await prisma_1.prisma.cliente.upsert({
                where: { razon_social: String(cliente_empresa || 'Empresa cliente') },
                update: { estado: 'Activo' },
                create: { razon_social: String(cliente_empresa || 'Empresa cliente'), estado: 'Activo' }
            });
            clienteId = cliente.id;
        }
        const trabajador = await prisma_1.prisma.trabajador.update({
            where: { id },
            data: {
                ci: cleanCi,
                codigo_qr: cleanQr,
                nombres: String(nombres || fullName.split(' ')[0] || fullName).trim(),
                apellidos: String(apellidos || fullName.split(' ').slice(1).join(' ') || '').trim(),
                nombre: fullName,
                cliente_empresa: String(cliente_empresa || '').trim(),
                cliente_id: clienteId,
                activo: estado !== 'Inactivo',
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
const createCuentaTrabajador = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'GERENTE')
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Gerente.' });
    const id = Number(req.params.id);
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '123456').trim();
    try {
        if (!Number.isInteger(id) || id <= 0)
            return res.status(400).json({ error: 'ID inválido' });
        if (!email || !email.includes('@'))
            return res.status(400).json({ error: 'Email válido obligatorio' });
        if (password.length < 4)
            return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
        const trabajador = await prisma_1.prisma.trabajador.findUnique({
            where: { id },
            include: { usuario: true }
        });
        if (!trabajador)
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        if (trabajador.usuarioId)
            return res.status(409).json({ error: 'El trabajador ya tiene cuenta vinculada' });
        const nombre = trabajador.nombre || `${trabajador.nombres} ${trabajador.apellidos}`.trim();
        const usuario = await prisma_1.prisma.usuario.create({
            data: {
                email,
                password_hash: password,
                rol: 'TRABAJADOR',
                nombre
            }
        });
        const updated = await prisma_1.prisma.trabajador.update({
            where: { id },
            data: { usuarioId: usuario.id },
            include: { cliente: true, usuario: { select: { id: true, email: true, rol: true, nombre: true } } }
        });
        res.status(201).json(updated);
    }
    catch (error) {
        if (error?.code === 'P2002')
            return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
        res.status(500).json({ error: 'Error al crear cuenta del trabajador' });
    }
};
exports.createCuentaTrabajador = createCuentaTrabajador;
const getClientes = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'GERENTE')
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
