import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { CalendarDays, ChefHat, Plus, Trash2, Utensils } from 'lucide-react';

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

const semanas = [1, 2, 3, 4];
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
  const [selectedPlatoId, setSelectedPlatoId] = useState<number | ''>('');
  const [selectedPlatoDetalleId, setSelectedPlatoDetalleId] = useState<number | null>(null);
  const [porciones, setPorciones] = useState(120);
  const [nuevoPlato, setNuevoPlato] = useState('');
  const [descripcionPlato, setDescripcionPlato] = useState('');
  const [recetaInsumoId, setRecetaInsumoId] = useState<number | ''>('');
  const [recetaCantidad, setRecetaCantidad] = useState(0);

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

  const fetchPlatos = async () => {
    const res = await fetch('/api/platos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setPlatos(await res.json());
  };

  const fetchInsumos = async () => {
    const res = await fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setInsumos(await res.json());
  };

  const fetchMenu = async () => {
    const res = await fetch(`/api/menus?anio=${anio}&mes=${mes}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMenu(await res.json());
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

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setAnio(year);
    setMes(month);
    setSelectedPlatoDetalleId(null);
  };

  const handleGuardarItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlatoId) return;

    try {
      const targetMenu = await ensureMenu();
      const res = await fetch(`/api/menus/${targetMenu.id}/items`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          semana,
          dia: selectedDia,
          turno: 'Almuerzo',
          plato_id: selectedPlatoId,
          porciones_estimadas: porciones
        })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'No se pudo guardar el plato del día');
        return;
      }
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
    if (!nuevoPlato.trim()) return;

    const res = await fetch('/api/platos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ nombre: nuevoPlato.trim(), descripcion: descripcionPlato.trim() })
    });
    if (res.ok) {
      const created = await res.json();
      setNuevoPlato('');
      setDescripcionPlato('');
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', margin: 0 }}>
            <Utensils size={26} /> Menú mensual
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Semana 1-4, almuerzo y receta por porción.</p>
        </div>
        <input
          className="input-field"
          type="month"
          value={`${anio}-${String(mes).padStart(2, '0')}`}
          onChange={event => handleMonthChange(event.target.value)}
          style={{ width: '180px', marginTop: 0 }}
        />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(360px, 1.25fr) minmax(360px, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <aside className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={18} /> {mes}/{anio}
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
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
        </aside>

        <section className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChefHat size={18} /> Platos de la semana
          </h3>

          <div style={{ display: 'grid', gap: '0.55rem', marginBottom: '1rem' }}>
            {dias.map(dia => {
              const item = itemsSemana.find(entry => entry.dia === dia);
              return (
                <button
                  key={dia}
                  onClick={() => {
                    setSelectedDia(dia);
                    if (item) {
                      setSelectedPlatoId(item.plato.id);
                      setSelectedPlatoDetalleId(item.plato.id);
                      setPorciones(item.porciones_estimadas);
                    }
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 84px 32px',
                    gap: '0.75rem',
                    alignItems: 'center',
                    border: selectedDia === dia ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    background: selectedDia === dia ? '#f8fafc' : '#fff',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <strong>{dia}</strong>
                  <span>{item?.plato.nombre || 'Sin plato'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item ? `${item.porciones_estimadas} porc.` : 'Almuerzo'}</span>
                  {item ? (
                    <Trash2
                      size={16}
                      color="var(--danger-color)"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEliminarItem(item.id);
                      }}
                    />
                  ) : <span />}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleGuardarItem} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Día</label>
                <select className="input-field" value={selectedDia} onChange={event => setSelectedDia(event.target.value)}>
                  {dias.map(dia => <option key={dia} value={dia}>{dia}</option>)}
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
              Guardar almuerzo
            </button>
          </form>
        </section>

        <section style={{ display: 'grid', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Catálogo de platos</h3>
            <form onSubmit={handleCrearPlato} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              <input className="input-field" value={nuevoPlato} onChange={event => setNuevoPlato(event.target.value)} placeholder="Nombre del plato" required />
              <input className="input-field" value={descripcionPlato} onChange={event => setDescripcionPlato(event.target.value)} placeholder="Descripción breve" />
              <button className="btn-secondary" type="submit" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Crear plato
              </button>
            </form>
            <select
              className="input-field"
              value={platoDetalle?.id || ''}
              onChange={event => setSelectedPlatoDetalleId(Number(event.target.value))}
            >
              {platos.map(plato => <option key={plato.id} value={plato.id}>{plato.nombre}</option>)}
            </select>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Receta mínima</h3>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{platoDetalle?.nombre || 'Sin plato'}</p>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
              {platoDetalle?.receta?.length ? platoDetalle.receta.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto 28px', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span>{item.insumo.nombre}</span>
                  <strong>{item.cantidad_por_porcion} {item.unidad_medida}</strong>
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
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Requerimiento semanal</h3>
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
