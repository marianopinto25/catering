"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMiConsumo = exports.saveFirma = exports.getConsumos = exports.createMiConsumo = exports.createConsumo = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../../core/api/prisma");
const auth_middleware_1 = require("../../../core/api/auth.middleware");
const TURNOS = ['Desayuno', 'Almuerzo', 'Cena'];
const METODOS = ['CI', 'QR', 'SESION'];
const today = () => new Date().toISOString().slice(0, 10);
const parseFecha = (raw) => {
    const value = String(raw || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};
const toIsoDate = (date) => date.toISOString().slice(0, 10);
const createConsumo = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'GERENTE')
        return res.status(403).json({ error: 'Acceso denegado' });
    const trabajadorId = Number(req.body.trabajador_id);
    const fecha = parseFecha(req.body.fecha);
    const turno = String(req.body.turno || '').trim();
    const metodo = String(req.body.metodo_identificacion || '').trim();
    try {
        if (!Number.isInteger(trabajadorId) || trabajadorId <= 0 || !fecha || !TURNOS.includes(turno) || !METODOS.includes(metodo)) {
            return res.status(400).json({ error: 'trabajador_id, fecha, turno y método son obligatorios' });
        }
        const trabajador = await prisma_1.prisma.trabajador.findUnique({ where: { id: trabajadorId } });
        if (!trabajador || trabajador.estado !== 'Activo')
            return res.status(404).json({ error: 'Trabajador no encontrado o inactivo' });
        const consumo = await prisma_1.prisma.consumo.create({
            data: {
                trabajador_id: trabajadorId,
                fecha,
                fechaTexto: toIsoDate(fecha),
                turno,
                metodo_identificacion: metodo,
                metodo,
                registrado_por_id: req.user.id
            },
            include: {
                trabajador: { include: { cliente: true } },
                registrado_por: { select: { id: true, nombre: true, rol: true } },
                firma: true
            }
        });
        res.status(201).json({ ...consumo, fecha: toIsoDate(consumo.fecha), estado_firma: consumo.firma ? 'Firmado' : 'Pendiente' });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'El trabajador ya registró consumo en este turno', requiere_autorizacion_gerente: true });
        }
        res.status(500).json({ error: 'Error al registrar consumo' });
    }
};
exports.createConsumo = createConsumo;
const createMiConsumo = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'TRABAJADOR')
        return res.status(403).json({ error: 'Solo trabajadores pueden registrar su consumo' });
    const turno = String(req.body.turno || '').trim();
    const metodo = String(req.body.metodo || 'SESION').trim().toUpperCase();
    const codigoQr = String(req.body.codigo_qr || '').trim();
    const fechaTexto = today();
    const fecha = parseFecha(fechaTexto);
    try {
        if (!TURNOS.includes(turno) || !METODOS.includes(metodo)) {
            return res.status(400).json({ error: 'Turno o método inválido' });
        }
        const trabajador = await prisma_1.prisma.trabajador.findFirst({
            where: { usuarioId: req.user.id, activo: true, estado: 'Activo' }
        });
        if (!trabajador)
            return res.status(404).json({ error: 'No existe trabajador vinculado a esta cuenta' });
        if (metodo === 'QR' && codigoQr && trabajador.codigo_qr !== codigoQr) {
            return res.status(400).json({ error: 'El código QR no corresponde al trabajador autenticado' });
        }
        const consumo = await prisma_1.prisma.consumo.create({
            data: {
                trabajador_id: trabajador.id,
                fecha,
                fechaTexto,
                turno,
                metodo_identificacion: metodo,
                metodo,
                registrado_por_id: req.user.id
            },
            include: {
                trabajador: { include: { cliente: true } },
                registrado_por: { select: { id: true, nombre: true, rol: true } },
                firma: true
            }
        });
        res.status(201).json({ ...consumo, fecha: fechaTexto, estado_firma: 'Pendiente' });
    }
    catch (error) {
        console.error('[consumos/mio] Error al registrar mi consumo:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Ya registraste consumo en este turno hoy' });
        }
        res.status(500).json({ error: 'Error al registrar mi consumo' });
    }
};
exports.createMiConsumo = createMiConsumo;
const getConsumos = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'GERENTE')
        return res.status(403).json({ error: 'Acceso denegado' });
    const fechaTexto = String(req.query.fecha || '').trim();
    const fecha = parseFecha(fechaTexto);
    const turno = String(req.query.turno || '').trim();
    try {
        const consumos = await prisma_1.prisma.consumo.findMany({
            where: {
                ...(fechaTexto ? { fechaTexto } : fecha ? { fecha } : {}),
                ...(TURNOS.includes(turno) ? { turno } : {})
            },
            orderBy: { registrado_en: 'desc' },
            include: {
                trabajador: { include: { cliente: true } },
                registrado_por: { select: { id: true, nombre: true, rol: true } },
                firma: true
            }
        });
        res.json(consumos.map(consumo => ({ ...consumo, fecha: consumo.fechaTexto || toIsoDate(consumo.fecha), firmaBase64: consumo.firmaBase64 || consumo.firma?.firma_base64 || null })));
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener consumos' });
    }
};
exports.getConsumos = getConsumos;
const saveFirma = async (req, res) => {
    const role = (0, auth_middleware_1.normalizeRole)(req.user?.rol);
    if (role !== 'TRABAJADOR' && role !== 'GERENTE')
        return res.status(403).json({ error: 'Acceso denegado' });
    const consumoId = Number(req.params.id);
    const firma = String(req.body.firmaBase64 || req.body.firma_base64 || '').trim();
    try {
        if (!Number.isInteger(consumoId) || consumoId <= 0)
            return res.status(400).json({ error: 'Consumo inválido' });
        if (!firma.startsWith('data:image/'))
            return res.status(400).json({ error: 'Firma obligatoria en formato base64' });
        const consumo = await prisma_1.prisma.consumo.findUnique({ where: { id: consumoId }, include: { trabajador: true } });
        if (!consumo)
            return res.status(404).json({ error: 'Consumo no encontrado' });
        if (role === 'TRABAJADOR' && consumo.trabajador.usuarioId !== req.user.id) {
            return res.status(403).json({ error: 'No puedes firmar un consumo de otro trabajador' });
        }
        const [updated, saved] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.consumo.update({
                where: { id: consumoId },
                data: { firmaBase64: firma }
            }),
            prisma_1.prisma.consumoFirma.upsert({
                where: { consumo_id: consumoId },
                update: { firma_base64: firma, firmado_en: new Date() },
                create: { consumo_id: consumoId, firma_base64: firma }
            })
        ]);
        res.status(201).json({ consumo_id: updated.id, firmado_en: saved.firmado_en, tiene_firma: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al guardar firma' });
    }
};
exports.saveFirma = saveFirma;
const getMiConsumo = async (req, res) => {
    if ((0, auth_middleware_1.normalizeRole)(req.user?.rol) !== 'TRABAJADOR')
        return res.status(403).json({ error: 'Acceso denegado' });
    const fechaTexto = String(req.query.fecha || today()).trim();
    const turno = String(req.query.turno || '').trim();
    try {
        const trabajador = await prisma_1.prisma.trabajador.findFirst({ where: { usuarioId: req.user.id } });
        if (!trabajador)
            return res.status(404).json({ error: 'No existe trabajador vinculado a esta cuenta' });
        const consumo = await prisma_1.prisma.consumo.findFirst({
            where: {
                trabajador_id: trabajador.id,
                fechaTexto,
                ...(TURNOS.includes(turno) ? { turno } : {})
            },
            orderBy: { registrado_en: 'desc' },
            include: {
                trabajador: { include: { cliente: true } },
                firma: true
            }
        });
        res.json(consumo ? { ...consumo, fecha: consumo.fechaTexto || toIsoDate(consumo.fecha), firmaBase64: consumo.firmaBase64 || consumo.firma?.firma_base64 || null } : null);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al consultar mi consumo' });
    }
};
exports.getMiConsumo = getMiConsumo;
