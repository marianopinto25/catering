"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFirma = exports.getConsumos = exports.createConsumo = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../../core/api/prisma");
const TURNOS = ['Desayuno', 'Almuerzo', 'Cena'];
const METODOS = ['CI', 'QR'];
const canOperateConsumos = (rol) => rol === 'Cliente' || rol === 'Gerente';
const parseFecha = (raw) => {
    const value = String(raw || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};
const toIsoDate = (date) => date.toISOString().slice(0, 10);
const createConsumo = async (req, res) => {
    if (!canOperateConsumos(req.user?.rol))
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
                turno,
                metodo_identificacion: metodo,
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
const getConsumos = async (req, res) => {
    if (!canOperateConsumos(req.user?.rol))
        return res.status(403).json({ error: 'Acceso denegado' });
    const fecha = parseFecha(req.query.fecha);
    const turno = String(req.query.turno || '').trim();
    try {
        const consumos = await prisma_1.prisma.consumo.findMany({
            where: {
                ...(fecha ? { fecha } : {}),
                ...(TURNOS.includes(turno) ? { turno } : {})
            },
            orderBy: { registrado_en: 'desc' },
            include: {
                trabajador: { include: { cliente: true } },
                registrado_por: { select: { id: true, nombre: true, rol: true } },
                firma: true
            }
        });
        res.json(consumos.map(consumo => ({ ...consumo, fecha: toIsoDate(consumo.fecha) })));
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener consumos' });
    }
};
exports.getConsumos = getConsumos;
const saveFirma = async (req, res) => {
    if (!canOperateConsumos(req.user?.rol))
        return res.status(403).json({ error: 'Acceso denegado' });
    const consumoId = Number(req.params.id);
    const firma = String(req.body.firma_base64 || '').trim();
    try {
        if (!Number.isInteger(consumoId) || consumoId <= 0)
            return res.status(400).json({ error: 'Consumo inválido' });
        if (!firma.startsWith('data:image/'))
            return res.status(400).json({ error: 'Firma obligatoria en formato base64' });
        const consumo = await prisma_1.prisma.consumo.findUnique({ where: { id: consumoId } });
        if (!consumo)
            return res.status(404).json({ error: 'Consumo no encontrado' });
        const saved = await prisma_1.prisma.consumoFirma.upsert({
            where: { consumo_id: consumoId },
            update: { firma_base64: firma, firmado_en: new Date() },
            create: { consumo_id: consumoId, firma_base64: firma }
        });
        res.status(201).json({ consumo_id: consumoId, firmado_en: saved.firmado_en, tiene_firma: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al guardar firma' });
    }
};
exports.saveFirma = saveFirma;
