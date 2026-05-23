import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../core/api/prisma';
import { AuthRequest } from '../../../core/api/auth.middleware';

const TURNOS = ['Desayuno', 'Almuerzo', 'Cena'];

const parseFecha = (raw: unknown) => {
  const value = String(raw || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const buildReporte = async (fecha: Date, turno: string) => {
  const consumos = await prisma.consumo.findMany({
    where: { fecha, turno },
    orderBy: { registrado_en: 'asc' },
    include: {
      trabajador: { include: { cliente: true } },
      registrado_por: { select: { id: true, nombre: true, rol: true } },
      firma: true
    }
  });

  const clienteId = consumos[0]?.trabajador.cliente_id || null;
  const validacion = clienteId
    ? await prisma.reporteValidacion.findUnique({
      where: { cliente_id_fecha_turno: { cliente_id: clienteId, fecha, turno } },
      include: {
        validado_por: { select: { id: true, nombre: true, rol: true } },
        cliente: true
      }
    })
    : null;

  return {
    fecha: toIsoDate(fecha),
    turno,
    estado: validacion ? 'Validado' : 'Pendiente validación',
    total_consumos: consumos.length,
    consumos: consumos.map(consumo => ({
      id: consumo.id,
      fecha: toIsoDate(consumo.fecha),
      turno: consumo.turno,
      metodo_identificacion: consumo.metodo_identificacion,
      registrado_en: consumo.registrado_en,
      registrado_por: consumo.registrado_por,
      trabajador: {
        id: consumo.trabajador.id,
        ci: consumo.trabajador.ci,
        codigo_qr: consumo.trabajador.codigo_qr,
        nombre_completo: `${consumo.trabajador.nombres} ${consumo.trabajador.apellidos}`,
        cliente: consumo.trabajador.cliente
      },
      firma: consumo.firma ? {
        existe: true,
        firmado_en: consumo.firma.firmado_en,
        firma_base64: consumo.firma.firma_base64
      } : { existe: false }
    })),
    validacion: validacion ? {
      id: validacion.id,
      estado: validacion.estado,
      validado_en: validacion.validado_en,
      validado_por: validacion.validado_por,
      cliente: validacion.cliente,
      firma_base64: validacion.firma_base64
    } : null
  };
};

export const getReporteDiario = async (req: AuthRequest, res: Response) => {
  if (req.user?.rol !== 'Cliente' && req.user?.rol !== 'Gerente') return res.status(403).json({ error: 'Acceso denegado' });

  const fecha = parseFecha(req.query.fecha);
  const turno = String(req.query.turno || '').trim();

  try {
    if (!fecha || !TURNOS.includes(turno)) return res.status(400).json({ error: 'fecha y turno son obligatorios' });
    res.json(await buildReporte(fecha, turno));
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte diario' });
  }
};

export const validarReporteDiario = async (req: AuthRequest, res: Response) => {
  if (req.user?.rol !== 'Cliente') return res.status(403).json({ error: 'Solo el rol Cliente puede validar reportes' });

  const fecha = parseFecha(req.body.fecha);
  const turno = String(req.body.turno || '').trim();
  const firma = String(req.body.firma_base64 || '').trim();

  try {
    if (!fecha || !TURNOS.includes(turno)) return res.status(400).json({ error: 'fecha y turno son obligatorios' });
    if (!firma.startsWith('data:image/')) return res.status(400).json({ error: 'Firma obligatoria en formato base64' });

    const firstConsumo = await prisma.consumo.findFirst({
      where: { fecha, turno },
      include: { trabajador: true }
    });
    const fallbackCliente = firstConsumo
      ? null
      : await prisma.cliente.findFirst({ where: { estado: 'Activo' }, orderBy: { id: 'asc' } });
    const clienteId = firstConsumo?.trabajador.cliente_id || fallbackCliente?.id;

    if (!clienteId) return res.status(400).json({ error: 'No existe cliente activo para validar el reporte' });

    const validacion = await prisma.reporteValidacion.create({
      data: {
        fecha,
        turno,
        cliente_id: clienteId,
        validado_por_id: req.user!.id,
        firma_base64: firma
      },
      include: {
        validado_por: { select: { id: true, nombre: true, rol: true } },
        cliente: true
      }
    });

    res.status(201).json({
      fecha: toIsoDate(validacion.fecha),
      turno: validacion.turno,
      estado: validacion.estado,
      validado_por: validacion.validado_por,
      validado_en: validacion.validado_en,
      cliente: validacion.cliente
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'El reporte ya fue validado' });
    }
    res.status(500).json({ error: 'Error al validar reporte diario' });
  }
};
