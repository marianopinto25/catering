"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequerimientoSemanal = exports.deleteMenuItem = exports.updateMenuItem = exports.addMenuItem = exports.updateMenu = exports.createMenu = exports.getMenus = exports.deleteRecetaItem = exports.updateRecetaItem = exports.addRecetaItem = exports.regenerateRecetaPasos = exports.updateRecetaPasos = exports.getRecetaPasos = exports.getReceta = exports.deletePlato = exports.updatePlato = exports.createPlato = exports.suggestPlato = exports.getPlatos = void 0;
const prisma_1 = require("../../../core/api/prisma");
const gemini_1 = require("./gemini");
const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const parseId = (value) => Number(value);
const validateSemana = (semana) => Number.isInteger(semana) && semana >= 1 && semana <= 4;
const buildPlatoSuggestion = async (nombre) => {
    const insumos = await prisma_1.prisma.insumo.findMany({
        where: { estado: 'Activo' },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, unidad_medida: true, categoria: true }
    });
    const suggestion = await (0, gemini_1.suggestPlatoWithGemini)(nombre, insumos);
    const insumoById = new Map(insumos.map(insumo => [insumo.id, insumo]));
    return {
        ...suggestion,
        receta: suggestion.receta.map(item => ({
            ...item,
            insumo: insumoById.get(item.insumo_id)
        })).filter(item => item.insumo)
    };
};
const ensureMenuEditable = async (id) => {
    const menu = await prisma_1.prisma.menuMes.findUnique({ where: { id } });
    if (!menu)
        throw new Error('Menú no encontrado');
    if (menu.estado === 'CERRADO')
        throw new Error('El menú está cerrado y no se puede editar');
    return menu;
};
const getPlatos = async (_req, res) => {
    try {
        const platos = await prisma_1.prisma.plato.findMany({
            where: { estado: 'Activo' },
            orderBy: { nombre: 'asc' },
            include: {
                receta: {
                    include: { insumo: true },
                    orderBy: { insumo: { nombre: 'asc' } }
                }
            }
        });
        res.json(platos);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener platos' });
    }
};
exports.getPlatos = getPlatos;
const suggestPlato = async (req, res) => {
    const nombre = String(req.query.nombre || '').trim();
    try {
        if (!nombre)
            return res.status(400).json({ error: 'El nombre del plato es obligatorio' });
        const suggestion = await buildPlatoSuggestion(nombre);
        res.json(suggestion);
    }
    catch (error) {
        res.status(503).json({ error: error instanceof Error ? error.message : 'Error al sugerir plato con IA' });
    }
};
exports.suggestPlato = suggestPlato;
const createPlato = async (req, res) => {
    const { nombre, descripcion, receta } = req.body;
    try {
        if (!nombre)
            return res.status(400).json({ error: 'El nombre del plato es obligatorio' });
        const plato = await prisma_1.prisma.$transaction(async (tx) => {
            const created = await tx.plato.create({
                data: { nombre, descripcion, estado: 'Activo' }
            });
            if (Array.isArray(receta)) {
                for (const item of receta) {
                    const cantidad = Number(item.cantidad_por_porcion);
                    if (!item.insumo_id || !item.unidad_medida || cantidad <= 0)
                        continue;
                    await tx.platoInsumo.upsert({
                        where: { plato_id_insumo_id: { plato_id: created.id, insumo_id: Number(item.insumo_id) } },
                        create: {
                            plato_id: created.id,
                            insumo_id: Number(item.insumo_id),
                            cantidad_por_porcion: cantidad,
                            unidad_medida: item.unidad_medida
                        },
                        update: {
                            cantidad_por_porcion: cantidad,
                            unidad_medida: item.unidad_medida
                        }
                    });
                }
            }
            return tx.plato.findUnique({
                where: { id: created.id },
                include: { receta: { include: { insumo: true }, orderBy: { insumo: { nombre: 'asc' } } } }
            });
        });
        res.status(201).json(plato);
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ error: 'Plato ya registrado' });
        res.status(500).json({ error: 'Error al crear plato' });
    }
};
exports.createPlato = createPlato;
const updatePlato = async (req, res) => {
    const id = parseId(req.params.id);
    const { nombre, descripcion } = req.body;
    try {
        if (!nombre)
            return res.status(400).json({ error: 'El nombre del plato es obligatorio' });
        const plato = await prisma_1.prisma.plato.update({
            where: { id },
            data: { nombre, descripcion }
        });
        res.json(plato);
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ error: 'Plato ya registrado' });
        res.status(500).json({ error: 'Error al actualizar plato' });
    }
};
exports.updatePlato = updatePlato;
const deletePlato = async (req, res) => {
    const id = parseId(req.params.id);
    try {
        await prisma_1.prisma.plato.update({
            where: { id },
            data: { estado: 'Inactivo' }
        });
        res.json({ message: 'Plato eliminado (Inactivo)' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar plato' });
    }
};
exports.deletePlato = deletePlato;
const getReceta = async (req, res) => {
    const plato_id = parseId(req.params.id);
    try {
        const receta = await prisma_1.prisma.platoInsumo.findMany({
            where: { plato_id },
            include: { insumo: true },
            orderBy: { insumo: { nombre: 'asc' } }
        });
        res.json(receta);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener receta' });
    }
};
exports.getReceta = getReceta;
const getRecetaPasos = async (req, res) => {
    const plato_id = parseId(req.params.id);
    try {
        const cached = await prisma_1.prisma.platoRecetaPasos.findUnique({ where: { plato_id } });
        if (cached) {
            return res.json({
                ...JSON.parse(cached.pasos_json),
                foto_url: cached.foto_url,
                fuente: cached.fuente,
                cached: true,
                updated_at: cached.updated_at
            });
        }
        const plato = await prisma_1.prisma.plato.findUnique({
            where: { id: plato_id },
            include: {
                receta: {
                    include: { insumo: true },
                    orderBy: { insumo: { nombre: 'asc' } }
                }
            }
        });
        if (!plato || plato.estado !== 'Activo')
            return res.status(404).json({ error: 'Plato no encontrado' });
        if (plato.receta.length === 0)
            return res.status(400).json({ error: 'Primero cargue la receta base del plato' });
        const steps = await (0, gemini_1.generateRecipeStepsWithGemini)({
            nombre: plato.nombre,
            descripcion: plato.descripcion,
            receta: plato.receta
        });
        await prisma_1.prisma.platoRecetaPasos.create({
            data: {
                plato_id,
                pasos_json: JSON.stringify(steps),
                fuente: 'gemini'
            }
        });
        res.json({ ...steps, cached: false });
    }
    catch (error) {
        res.status(503).json({ error: error instanceof Error ? error.message : 'Error al generar receta paso a paso' });
    }
};
exports.getRecetaPasos = getRecetaPasos;
const updateRecetaPasos = async (req, res) => {
    const plato_id = parseId(req.params.id);
    const { titulo, rendimiento, tiempo_estimado, pasos, tips, foto_url } = req.body;
    try {
        if (!titulo || !rendimiento || !tiempo_estimado || !Array.isArray(pasos) || pasos.length === 0) {
            return res.status(400).json({ error: 'Título, rendimiento, tiempo y pasos son obligatorios' });
        }
        const payload = {
            titulo: String(titulo).trim(),
            rendimiento: String(rendimiento).trim(),
            tiempo_estimado: String(tiempo_estimado).trim(),
            pasos: pasos.map((paso) => String(paso || '').trim()).filter(Boolean),
            tips: Array.isArray(tips) ? tips.map((tip) => String(tip || '').trim()).filter(Boolean) : [],
            fuente: 'chef'
        };
        if (payload.pasos.length === 0)
            return res.status(400).json({ error: 'Agregue al menos un paso' });
        const saved = await prisma_1.prisma.platoRecetaPasos.upsert({
            where: { plato_id },
            create: {
                plato_id,
                pasos_json: JSON.stringify(payload),
                foto_url: foto_url || null,
                fuente: 'chef'
            },
            update: {
                pasos_json: JSON.stringify(payload),
                foto_url: foto_url || null,
                fuente: 'chef'
            }
        });
        res.json({
            ...payload,
            foto_url: saved.foto_url,
            fuente: saved.fuente,
            cached: true,
            updated_at: saved.updated_at
        });
    }
    catch (error) {
        res.status(503).json({ error: error instanceof Error ? error.message : 'Error al guardar receta' });
    }
};
exports.updateRecetaPasos = updateRecetaPasos;
const regenerateRecetaPasos = async (req, res) => {
    const plato_id = parseId(req.params.id);
    try {
        await prisma_1.prisma.platoRecetaPasos.deleteMany({ where: { plato_id } });
        return (0, exports.getRecetaPasos)(req, res);
    }
    catch (error) {
        res.status(503).json({ error: error instanceof Error ? error.message : 'Error al regenerar receta' });
    }
};
exports.regenerateRecetaPasos = regenerateRecetaPasos;
const addRecetaItem = async (req, res) => {
    const plato_id = parseId(req.params.id);
    const { insumo_id, cantidad_por_porcion, unidad_medida } = req.body;
    const cantidad = Number(cantidad_por_porcion);
    try {
        if (!insumo_id || !unidad_medida || cantidad <= 0) {
            return res.status(400).json({ error: 'Insumo, unidad y cantidad por porción son obligatorios' });
        }
        const item = await prisma_1.prisma.platoInsumo.upsert({
            where: { plato_id_insumo_id: { plato_id, insumo_id: Number(insumo_id) } },
            create: {
                plato_id,
                insumo_id: Number(insumo_id),
                cantidad_por_porcion: cantidad,
                unidad_medida
            },
            update: {
                cantidad_por_porcion: cantidad,
                unidad_medida
            },
            include: { insumo: true }
        });
        res.status(201).json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al guardar insumo de receta' });
    }
};
exports.addRecetaItem = addRecetaItem;
const updateRecetaItem = async (req, res) => {
    const id = parseId(req.params.recetaId);
    const { cantidad_por_porcion, unidad_medida } = req.body;
    const cantidad = Number(cantidad_por_porcion);
    try {
        if (!unidad_medida || cantidad <= 0) {
            return res.status(400).json({ error: 'Unidad y cantidad por porción son obligatorias' });
        }
        const item = await prisma_1.prisma.platoInsumo.update({
            where: { id },
            data: { cantidad_por_porcion: cantidad, unidad_medida },
            include: { insumo: true }
        });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar receta' });
    }
};
exports.updateRecetaItem = updateRecetaItem;
const deleteRecetaItem = async (req, res) => {
    const id = parseId(req.params.recetaId);
    try {
        await prisma_1.prisma.platoInsumo.delete({ where: { id } });
        res.json({ message: 'Insumo removido de la receta' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al eliminar insumo de receta' });
    }
};
exports.deleteRecetaItem = deleteRecetaItem;
const getMenus = async (req, res) => {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);
    try {
        const where = anio && mes ? { anio, mes } : {};
        const menus = await prisma_1.prisma.menuMes.findMany({
            where,
            orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
            include: {
                items: {
                    orderBy: [{ semana: 'asc' }, { dia: 'asc' }],
                    include: {
                        plato: {
                            include: {
                                receta: { include: { insumo: true } }
                            }
                        }
                    }
                }
            }
        });
        res.json(anio && mes ? menus[0] || null : menus);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener menú mensual' });
    }
};
exports.getMenus = getMenus;
const createMenu = async (req, res) => {
    const { anio, mes, estado } = req.body;
    try {
        const menu = await prisma_1.prisma.menuMes.create({
            data: {
                anio: Number(anio),
                mes: Number(mes),
                estado: estado || 'BORRADOR'
            }
        });
        res.status(201).json(menu);
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ error: 'Ya existe un menú para ese mes' });
        res.status(500).json({ error: 'Error al crear menú mensual' });
    }
};
exports.createMenu = createMenu;
const updateMenu = async (req, res) => {
    const id = parseId(req.params.id);
    const { anio, mes, estado } = req.body;
    try {
        const menu = await prisma_1.prisma.menuMes.update({
            where: { id },
            data: {
                anio: Number(anio),
                mes: Number(mes),
                estado: estado || 'BORRADOR'
            }
        });
        res.json(menu);
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ error: 'Ya existe un menú para ese mes' });
        res.status(500).json({ error: 'Error al actualizar menú mensual' });
    }
};
exports.updateMenu = updateMenu;
const addMenuItem = async (req, res) => {
    const menu_mes_id = parseId(req.params.id);
    const { semana, dia, turno, plato_id, porciones_estimadas } = req.body;
    const semanaNumber = Number(semana);
    const turnoFinal = turno || 'Almuerzo';
    const porciones = Number(porciones_estimadas);
    try {
        await ensureMenuEditable(menu_mes_id);
        if (!validateSemana(semanaNumber) || !DIAS_VALIDOS.includes(dia) || !plato_id || porciones <= 0) {
            return res.status(400).json({ error: 'Semana, día, plato y porciones son obligatorios' });
        }
        const item = await prisma_1.prisma.menuItem.upsert({
            where: {
                menu_mes_id_semana_dia_turno: {
                    menu_mes_id,
                    semana: semanaNumber,
                    dia,
                    turno: turnoFinal
                }
            },
            create: {
                menu_mes_id,
                semana: semanaNumber,
                dia,
                turno: turnoFinal,
                plato_id: Number(plato_id),
                porciones_estimadas: porciones
            },
            update: {
                plato_id: Number(plato_id),
                porciones_estimadas: porciones
            },
            include: { plato: true }
        });
        res.status(201).json(item);
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Error al guardar ítem del menú' });
    }
};
exports.addMenuItem = addMenuItem;
const updateMenuItem = async (req, res) => {
    const menu_mes_id = parseId(req.params.id);
    const id = parseId(req.params.itemId);
    const { semana, dia, turno, plato_id, porciones_estimadas } = req.body;
    const semanaNumber = Number(semana);
    const porciones = Number(porciones_estimadas);
    try {
        await ensureMenuEditable(menu_mes_id);
        if (!validateSemana(semanaNumber) || !DIAS_VALIDOS.includes(dia) || !plato_id || porciones <= 0) {
            return res.status(400).json({ error: 'Semana, día, plato y porciones son obligatorios' });
        }
        const item = await prisma_1.prisma.menuItem.update({
            where: { id },
            data: {
                semana: semanaNumber,
                dia,
                turno: turno || 'Almuerzo',
                plato_id: Number(plato_id),
                porciones_estimadas: porciones
            },
            include: { plato: true }
        });
        res.json(item);
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ error: 'Ya existe un plato para ese día y turno' });
        res.status(400).json({ error: error.message || 'Error al actualizar ítem del menú' });
    }
};
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = async (req, res) => {
    const menu_mes_id = parseId(req.params.id);
    const id = parseId(req.params.itemId);
    try {
        await ensureMenuEditable(menu_mes_id);
        await prisma_1.prisma.menuItem.delete({ where: { id } });
        res.json({ message: 'Ítem removido del menú' });
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Error al eliminar ítem del menú' });
    }
};
exports.deleteMenuItem = deleteMenuItem;
const getRequerimientoSemanal = async (req, res) => {
    const menu_mes_id = parseId(req.params.id);
    const semana = Number(req.query.semana);
    try {
        if (!validateSemana(semana))
            return res.status(400).json({ error: 'Semana inválida' });
        const items = await prisma_1.prisma.menuItem.findMany({
            where: { menu_mes_id, semana },
            include: {
                plato: {
                    include: {
                        receta: {
                            include: { insumo: true }
                        }
                    }
                }
            }
        });
        const acumulado = new Map();
        for (const item of items) {
            for (const receta of item.plato.receta) {
                const actual = acumulado.get(receta.insumo_id) || {
                    insumo_id: receta.insumo_id,
                    nombre: receta.insumo.nombre,
                    unidad_medida: receta.unidad_medida,
                    cantidad_requerida: 0,
                    porciones_totales: 0
                };
                actual.cantidad_requerida += receta.cantidad_por_porcion * item.porciones_estimadas;
                actual.porciones_totales += item.porciones_estimadas;
                acumulado.set(receta.insumo_id, actual);
            }
        }
        res.json(Array.from(acumulado.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    }
    catch (error) {
        res.status(500).json({ error: 'Error al calcular requerimiento semanal' });
    }
};
exports.getRequerimientoSemanal = getRequerimientoSemanal;
