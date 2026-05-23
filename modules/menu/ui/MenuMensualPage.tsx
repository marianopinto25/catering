import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { Bot, CalendarDays, ChefHat, FileUp, Plus, Sparkles, Trash2, Utensils } from 'lucide-react';

interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface RecetaItem {
  id: number;
  insumo_id: number;
  cantidad_por_porcion: number;
  unidad_medida: string;
  insumo: Insumo;
}

interface Plato {
  id: number;
  nombre: string;
  descripcion?: string;
  receta: RecetaItem[];
}

interface RecetaSugeridaItem {
  insumo_id: number;
  cantidad_por_porcion: number;
  unidad_medida: string;
  insumo: Insumo;
}

interface PlatoSuggestion {
  descripcion: string;
  fuente?: string;
  receta: RecetaSugeridaItem[];
}

interface MenuItem {
  id: number;
  semana: number;
  dia: string;
  turno: string;
  porciones_estimadas: number;
  plato: Plato;
}

interface MenuMes {
  id: number;
  anio: number;
  mes: number;
  estado: string;
  items: MenuItem[];
}

interface RequerimientoItem {
  insumo_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_requerida: number;
  porciones_totales: number;
}

interface ImportRow {
  semana: number;
  dia: string;
  turno: string;
  plato: string;
  porciones: number;
}

const semanas = [1, 2, 3, 4];
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const turnos = ['Desayuno', 'Almuerzo', 'Cena'];

const normalizeText = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeDia = (value: string) => {
  const found = dias.find(dia => normalizeText(dia) === normalizeText(value));
  return found || value.trim();
};

const normalizeTurno = (value: string) => {
  const found = turnos.find(turno => normalizeText(turno) === normalizeText(value));
  return found || 'Almuerzo';
};

const splitCsvLine = (line: string) => {
  const delimiter = line.includes(';') ? ';' : ',';
  const result: string[] = [];
  let current = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(value => value.replace(/^"|"$/g, ''));
};

const parseMenuCsv = (text: string): ImportRow[] => {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, index) => {
    const [semana, dia, turno, plato, porciones] = splitCsvLine(line);
    const row = {
      semana: Number(semana),
      dia: normalizeDia(dia || ''),
      turno: normalizeTurno(turno || ''),
      plato: (plato || '').trim(),
      porciones: Number(porciones)
    };

    if (!Number.isInteger(row.semana) || row.semana < 1 || row.semana > 4 || !dias.includes(row.dia) || !turnos.includes(row.turno) || !row.plato || row.porciones <= 0) {
      throw new Error(`Fila ${index + 2}: revisa semana, día, turno, plato y porciones`);
    }

    return row;
  });
};

const MenuMensualPage: React.FC = () => {
  const now = new Date();
  const { token } = useAuth();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [semana, setSemana] = useState(1);
  const [menu, setMenu] = useState<MenuMes | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [requerimiento, setRequerimiento] = useState<RequerimientoItem[]>([]);
  const [selectedDia, setSelectedDia] = useState('Lunes');
  const [selectedTurno, setSelectedTurno] = useState('Almuerzo');
  const [selectedPlatoId, setSelectedPlatoId] = useState<number | ''>('');
  const [selectedPlatoDetalleId, setSelectedPlatoDetalleId] = useState<number | null>(null);
  const [porciones, setPorciones] = useState(120);
  const [nuevoPlato, setNuevoPlato] = useState('');
  const [descripcionPlato, setDescripcionPlato] = useState('');
  const [recetaSugerida, setRecetaSugerida] = useState<RecetaSugeridaItem[]>([]);
  const [sugerenciaStatus, setSugerenciaStatus] = useState('');
  const [sugerenciaError, setSugerenciaError] = useState('');
  const [editingRecetaId, setEditingRecetaId] = useState<number | null>(null);
  const [recetaInsumoId, setRecetaInsumoId] = useState<number | ''>('');
  const [recetaCantidad, setRecetaCantidad] = useState(0);
  const [importMessage, setImportMessage] = useState('');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  const itemsSemana = useMemo(() => (
    (menu?.items || []).filter(item => item.semana === semana)
  ), [menu, semana]);

  const platoDetalle = useMemo(() => (
    platos.find(plato => plato.id === selectedPlatoDetalleId) || itemsSemana[0]?.plato || platos[0] || null
  ), [platos, selectedPlatoDetalleId, itemsSemana]);

  const sugerenciaEnCurso = sugerenciaStatus === 'Gemini está pensando la receta...';

  const menuBySlot = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const item of itemsSemana) map.set(`${item.dia}-${item.turno}`, item);
    return map;
  }, [itemsSemana]);

  const fetchPlatos = async () => {
    const res = await fetch('/api/platos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setPlatos(data);
      return data as Plato[];
    }
    return platos;
  };

  const fetchInsumos = async () => {
    const res = await fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setInsumos(await res.json());
  };

  const fetchMenu = async () => {
    const res = await fetch(`/api/menus?anio=${anio}&mes=${mes}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMenu(data);
      return data as MenuMes | null;
    }
    return menu;
  };

  const fetchRequerimiento = async (menuId: number) => {
    const res = await fetch(`/api/menus/${menuId}/requerimiento-semanal?semana=${semana}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setRequerimiento(await res.json());
  };

  useEffect(() => {
    fetchPlatos();
    fetchInsumos();
  }, [token]);

  useEffect(() => {
    fetchMenu();
  }, [anio, mes, token]);

  useEffect(() => {
    if (menu?.id) {
      fetchRequerimiento(menu.id);
    } else {
      setRequerimiento([]);
    }
  }, [menu?.id, semana]);

  useEffect(() => {
    if (!selectedPlatoId && platos[0]) setSelectedPlatoId(platos[0].id);
    if (!selectedPlatoDetalleId && platos[0]) setSelectedPlatoDetalleId(platos[0].id);
    if (!recetaInsumoId && insumos[0]) setRecetaInsumoId(insumos[0].id);
  }, [platos, insumos, selectedPlatoId, selectedPlatoDetalleId, recetaInsumoId]);

  useEffect(() => {
    const nombre = nuevoPlato.trim();
    if (nombre.length < 3) {
      setSugerenciaStatus('');
      setSugerenciaError('');
      setRecetaSugerida([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSugerenciaStatus('Gemini está pensando la receta...');
        setSugerenciaError('');
        const res = await fetch(`/api/platos/sugerir?nombre=${encodeURIComponent(nombre)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo generar la sugerencia con Gemini');

        const suggestion = data as PlatoSuggestion;
        setDescripcionPlato(suggestion.descripcion || '');
        setRecetaSugerida(Array.isArray(suggestion.receta) ? suggestion.receta : []);
        setSugerenciaStatus(suggestion.receta?.length ? 'Gemini preparó una receta base editable.' : 'Gemini respondió sin insumos compatibles del catálogo.');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setRecetaSugerida([]);
          setSugerenciaStatus('');
          setSugerenciaError(error.message || 'No se pudo generar la sugerencia con Gemini.');
        }
      }
    }, 700);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [nuevoPlato, token]);

  const ensureMenu = async () => {
    if (menu) return menu;
    const res = await fetch('/api/menus', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ anio, mes, estado: 'BORRADOR' })
    });
    if (!res.ok) throw new Error('No se pudo crear el menú mensual');
    const created = await res.json();
    setMenu({ ...created, items: [] });
    return { ...created, items: [] } as MenuMes;
  };

  const ensurePlato = async (nombre: string, currentPlatos: Plato[]) => {
    const existing = currentPlatos.find(plato => normalizeText(plato.nombre) === normalizeText(nombre));
    if (existing) return { plato: existing, platosList: currentPlatos };

    const res = await fetch('/api/platos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ nombre, descripcion: 'Importado desde archivo de menú' })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `No se pudo crear el plato ${nombre}`);
    }

    const created = await res.json();
    return { plato: created as Plato, platosList: [...currentPlatos, created] as Plato[] };
  };

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setAnio(year);
    setMes(month);
    setSelectedPlatoDetalleId(null);
  };

  const saveMenuSlot = async (targetMenuId: number, item: { semana: number; dia: string; turno: string; plato_id: number; porciones_estimadas: number }) => {
    const res = await fetch(`/api/menus/${targetMenuId}/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(item)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'No se pudo guardar el plato del menú');
    }
    return res.json();
  };

  const handleGuardarItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlatoId) return;

    try {
      const targetMenu = await ensureMenu();
      await saveMenuSlot(targetMenu.id, {
        semana,
        dia: selectedDia,
        turno: selectedTurno,
        plato_id: Number(selectedPlatoId),
        porciones_estimadas: porciones
      });
      await fetchMenu();
      await fetchRequerimiento(targetMenu.id);
      setSelectedPlatoDetalleId(Number(selectedPlatoId));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEliminarItem = async (itemId: number) => {
    if (!menu || !window.confirm('¿Quitar este plato del menú?')) return;
    const res = await fetch(`/api/menus/${menu.id}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      await fetchMenu();
      await fetchRequerimiento(menu.id);
    }
  };

  const handleCrearPlato = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nuevoPlato.trim() || sugerenciaEnCurso) return;

    const res = await fetch('/api/platos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        nombre: nuevoPlato.trim(),
        descripcion: descripcionPlato.trim(),
        receta: recetaSugerida.map(item => ({
          insumo_id: item.insumo_id,
          cantidad_por_porcion: item.cantidad_por_porcion,
          unidad_medida: item.unidad_medida
        }))
      })
    });
    if (res.ok) {
      const created = await res.json();
      setNuevoPlato('');
      setDescripcionPlato('');
      setRecetaSugerida([]);
      setSugerenciaStatus('');
      setSugerenciaError('');
      await fetchPlatos();
      setSelectedPlatoId(created.id);
      setSelectedPlatoDetalleId(created.id);
    } else {
      const data = await res.json();
      alert(data.error || 'No se pudo crear el plato');
    }
  };

  const handleAgregarReceta = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!platoDetalle || !recetaInsumoId || recetaCantidad <= 0) return;

    const insumo = insumos.find(item => item.id === Number(recetaInsumoId));
    const res = await fetch(`/api/platos/${platoDetalle.id}/receta`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        insumo_id: recetaInsumoId,
        cantidad_por_porcion: recetaCantidad,
        unidad_medida: insumo?.unidad_medida || ''
      })
    });

    if (res.ok) {
      setRecetaCantidad(0);
      await fetchPlatos();
      if (menu?.id) await fetchRequerimiento(menu.id);
    }
  };

  const handleEliminarReceta = async (recetaId: number) => {
    if (!platoDetalle || !window.confirm('¿Quitar insumo de la receta?')) return;
    const res = await fetch(`/api/platos/${platoDetalle.id}/receta/${recetaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      await fetchPlatos();
      if (menu?.id) await fetchRequerimiento(menu.id);
    }
  };

  const handleActualizarRecetaCantidad = async (item: RecetaItem, cantidad: number) => {
    if (!platoDetalle || cantidad <= 0) return;

    setEditingRecetaId(item.id);
    const res = await fetch(`/api/platos/${platoDetalle.id}/receta/${item.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        cantidad_por_porcion: cantidad,
        unidad_medida: item.unidad_medida
      })
    });

    setEditingRecetaId(null);
    if (res.ok) {
      await fetchPlatos();
      if (menu?.id) await fetchRequerimiento(menu.id);
    } else {
      const data = await res.json();
      alert(data.error || 'No se pudo actualizar la cantidad');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportMessage('Leyendo archivo...');
      const text = await file.text();
      const rows = parseMenuCsv(text);
      const targetMenu = await ensureMenu();
      let platosList = await fetchPlatos();

      for (const row of rows) {
        const result = await ensurePlato(row.plato, platosList);
        platosList = result.platosList;
        await saveMenuSlot(targetMenu.id, {
          semana: row.semana,
          dia: row.dia,
          turno: row.turno,
          plato_id: result.plato.id,
          porciones_estimadas: row.porciones
        });
      }

      setPlatos(platosList);
      await fetchMenu();
      await fetchRequerimiento(targetMenu.id);
      setImportMessage(`Importación lista: ${rows.length} filas cargadas.`);
      event.target.value = '';
    } catch (error: any) {
      setImportMessage(error.message);
    }
  };

  const downloadTemplate = () => {
    const sample = [
      'semana,dia,turno,plato,porciones',
      '1,Lunes,Desayuno,Avena con frutas,80',
      '1,Lunes,Almuerzo,Arroz con pollo,120',
      '1,Lunes,Cena,Sopa de verduras,90'
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formato-menu.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', margin: 0 }}>
            <Utensils size={26} /> Menú mensual
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Planifica desayuno, almuerzo y cena. Cada plato puede tener receta por porción.</p>
        </div>
        <input
          className="input-field"
          type="month"
          value={`${anio}-${String(mes).padStart(2, '0')}`}
          onChange={event => handleMonthChange(event.target.value)}
          style={{ width: '180px', marginTop: 0 }}
        />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(460px, 1.35fr) minmax(380px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <aside className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={18} /> {mes}/{anio}
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            {semanas.map(numero => (
              <button
                key={numero}
                className={semana === numero ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setSemana(numero)}
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
              >
                Semana {numero}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileUp size={17} /> Cargar desde Excel
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              En Excel crea columnas: semana, dia, turno, plato, porciones. Guarda como CSV y súbelo aquí.
            </p>
            <button className="btn-secondary" type="button" onClick={downloadTemplate} style={{ width: '100%', margin: '0.75rem 0' }}>
              Descargar formato
            </button>
            <input className="input-field" type="file" accept=".csv,text/csv" onChange={handleImportFile} />
            {importMessage && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{importMessage}</p>}
          </div>
        </aside>

        <section className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChefHat size={18} /> Semana {semana}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1rem' }}>
            Cada día tiene tres servicios. Selecciona una celda para editarla.
          </p>

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table className="table-container">
              <thead>
                <tr>
                  <th>Día</th>
                  {turnos.map(turno => <th key={turno}>{turno}</th>)}
                </tr>
              </thead>
              <tbody>
                {dias.map(dia => (
                  <tr key={dia}>
                    <td><strong>{dia}</strong></td>
                    {turnos.map(turno => {
                      const item = menuBySlot.get(`${dia}-${turno}`);
                      const isSelected = selectedDia === dia && selectedTurno === turno;
                      return (
                        <td key={turno} style={{ minWidth: '160px', background: isSelected ? '#f8fafc' : 'transparent' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDia(dia);
                              setSelectedTurno(turno);
                              if (item) {
                                setSelectedPlatoId(item.plato.id);
                                setSelectedPlatoDetalleId(item.plato.id);
                                setPorciones(item.porciones_estimadas);
                              }
                            }}
                            style={{ width: '100%', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                          >
                            <strong style={{ display: 'block', fontSize: '0.86rem' }}>{item?.plato.nombre || 'Sin plato'}</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item ? `${item.porciones_estimadas} porciones` : 'Click para asignar'}</span>
                          </button>
                          {item && (
                            <button
                              className="btn-secondary"
                              onClick={() => handleEliminarItem(item.id)}
                              style={{ marginTop: '0.4rem', padding: '0.2rem 0.4rem' }}
                              type="button"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleGuardarItem} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Día</label>
                <select className="input-field" value={selectedDia} onChange={event => setSelectedDia(event.target.value)}>
                  {dias.map(dia => <option key={dia} value={dia}>{dia}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Servicio</label>
                <select className="input-field" value={selectedTurno} onChange={event => setSelectedTurno(event.target.value)}>
                  {turnos.map(turno => <option key={turno} value={turno}>{turno}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Porciones</label>
                <input className="input-field" type="number" min="1" value={porciones} onChange={event => setPorciones(Number(event.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Plato</label>
              <select className="input-field" value={selectedPlatoId} onChange={event => setSelectedPlatoId(Number(event.target.value))} required>
                {platos.map(plato => <option key={plato.id} value={plato.id}>{plato.nombre}</option>)}
              </select>
            </div>
            <button className="btn-primary" type="submit" style={{ width: '100%' }}>
              Guardar {selectedTurno.toLowerCase()}
            </button>
          </form>
        </section>

        <section style={{ display: 'grid', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Nuevo plato con IA</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '0.75rem' }}>
              Escribe el nombre. Gemini propone descripción e insumos; después puedes ajustar la receta.
            </p>
            <form onSubmit={handleCrearPlato} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              <input className="input-field" value={nuevoPlato} onChange={event => setNuevoPlato(event.target.value)} placeholder="Nombre del plato" required />
              <input className="input-field" value={descripcionPlato} onChange={event => setDescripcionPlato(event.target.value)} placeholder="Descripción breve" />
              {(sugerenciaStatus || sugerenciaError || recetaSugerida.length > 0) && (
                <div style={{ border: '1px solid #dbeafe', borderRadius: '8px', padding: '0.85rem', background: sugerenciaError ? '#fef2f2' : 'linear-gradient(135deg, #eff6ff, #f7fee7)', display: 'grid', gap: '0.7rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div className={sugerenciaEnCurso ? 'ai-robot-icon is-thinking' : 'ai-robot-icon'}>
                      <Bot size={22} />
                      {sugerenciaEnCurso && (
                        <>
                          <span className="ai-gear ai-gear-one" />
                          <span className="ai-gear ai-gear-two" />
                        </>
                      )}
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: sugerenciaError ? '#991b1b' : '#075985', fontWeight: 800, fontSize: '0.86rem' }}>
                        <Sparkles size={14} /> Agente IA de recetas
                      </span>
                      <p style={{ color: sugerenciaError ? '#991b1b' : 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                        {sugerenciaError || sugerenciaStatus}
                      </p>
                    </div>
                  </div>
                  {recetaSugerida.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      {recetaSugerida.map(item => (
                        <div key={item.insumo_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto 28px', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                          <span>{item.insumo.nombre}</span>
                          <strong>{item.cantidad_por_porcion} {item.unidad_medida}</strong>
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => setRecetaSugerida(current => current.filter(sugerido => sugerido.insumo_id !== item.insumo_id))}
                            style={{ padding: '0.2rem' }}
                            aria-label={`Quitar ${item.insumo.nombre}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button className="btn-secondary" type="submit" disabled={sugerenciaEnCurso} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> {sugerenciaEnCurso ? 'Preparando plato' : 'Crear plato'}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Editar receta base</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  Elige un plato del catálogo y define cuánto consume una porción.
                </p>
              </div>
              <span style={{ borderRadius: '999px', padding: '0.3rem 0.55rem', background: '#eff6ff', color: '#075985', fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                Por porción
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Plato que quieres editar</label>
              <select
                className="input-field"
                value={platoDetalle?.id || ''}
                onChange={event => setSelectedPlatoDetalleId(Number(event.target.value))}
              >
                {platos.map(plato => <option key={plato.id} value={plato.id}>{plato.nombre}</option>)}
              </select>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', background: '#f8fafc', marginBottom: '1rem' }}>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1rem' }}>{platoDetalle?.nombre || 'Sin plato seleccionado'}</strong>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                {platoDetalle?.descripcion || 'Sin descripción registrada.'}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
              {platoDetalle?.receta?.length ? platoDetalle.receta.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 116px 34px', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span>{item.insumo.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      className="input-field"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={item.cantidad_por_porcion}
                      disabled={editingRecetaId === item.id}
                      onBlur={event => handleActualizarRecetaCantidad(item, Number(event.target.value))}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      aria-label={`Cantidad de ${item.insumo.nombre}`}
                      style={{ marginTop: 0, height: '38px', padding: '0.45rem 0.5rem', textAlign: 'right' }}
                    />
                    <strong style={{ minWidth: '34px' }}>{item.unidad_medida}</strong>
                  </div>
                  <button className="btn-secondary" onClick={() => handleEliminarReceta(item.id)} style={{ padding: '0.25rem' }} type="button">
                    <Trash2 size={14} />
                  </button>
                </div>
              )) : (
                <p style={{ color: 'var(--text-muted)' }}>Receta pendiente.</p>
              )}
            </div>

            <form onSubmit={handleAgregarReceta} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '0.75rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Insumo</label>
                <select className="input-field" value={recetaInsumoId} onChange={event => setRecetaInsumoId(Number(event.target.value))}>
                  {insumos.map(insumo => <option key={insumo.id} value={insumo.id}>{insumo.nombre} ({insumo.unidad_medida})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cant.</label>
                <input className="input-field" type="number" min="0" step="0.01" value={recetaCantidad} onChange={event => setRecetaCantidad(Number(event.target.value))} />
              </div>
              <button className="btn-primary" type="submit" style={{ gridColumn: '1 / -1' }}>
                Agregar a receta
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Requerimiento semanal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '0.75rem' }}>Suma desayuno, almuerzo y cena de la semana seleccionada.</p>
            <table className="table-container">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {requerimiento.length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center' }}>Sin requerimientos.</td></tr>
                ) : requerimiento.map(item => (
                  <tr key={item.insumo_id}>
                    <td>{item.nombre}</td>
                    <td><strong>{item.cantidad_requerida.toFixed(2)} {item.unidad_medida}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default MenuMensualPage;
