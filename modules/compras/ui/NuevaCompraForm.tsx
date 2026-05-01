import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@core/AuthContext';
import { ClipboardList, Plus, Save, ShoppingCart, Trash2 } from 'lucide-react';
import { formatMoney } from '@core/format';

interface Proveedor {
  id: number;
  razon_social: string;
}

interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface ItemDetalle {
  insumo_id: number;
  cantidad: number;
  precio_unitario: number;
}

interface MenuSemanaItem {
  id: number;
  dia: string;
  turno: string;
  porciones_estimadas: number;
  plato: { id: number; nombre: string };
}

interface SugerenciaItem {
  insumo_id: number;
  nombre: string;
  unidad: string;
  requerido: number;
  existencia: number;
  enOrden: number;
  sugerido: number;
  vida_util_dias: number;
  limite_perecible: number;
}

interface SugerenciaCompra {
  anio: number;
  mes: number;
  semana: number;
  menu: { id: number; estado: string; items: MenuSemanaItem[] } | null;
  items: SugerenciaItem[];
}

const semanas = [1, 2, 3, 4];
const turnosOrden = ['Desayuno', 'Almuerzo', 'Cena'];

const NuevaCompraForm: React.FC = () => {
  const now = new Date();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [fecha, setFecha] = useState(now.toISOString().slice(0, 10));
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [semana, setSemana] = useState(1);
  const [detalles, setDetalles] = useState<ItemDetalle[]>([]);
  const [sugerencia, setSugerencia] = useState<SugerenciaCompra | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProv, resIns] = await Promise.all([
          fetch('/api/proveedores', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (resProv.ok) setProveedores(await resProv.json());
        if (resIns.ok) setInsumos(await resIns.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    fetchSugerencia();
  }, [anio, mes, semana, token]);

  const insumoById = useMemo(() => {
    const map = new Map<number, Insumo>();
    for (const insumo of insumos) map.set(insumo.id, insumo);
    return map;
  }, [insumos]);

  const menuItems = useMemo(() => {
    const items = sugerencia?.menu?.items || [];
    return [...items].sort((a, b) => {
      if (a.dia !== b.dia) return a.dia.localeCompare(b.dia);
      return turnosOrden.indexOf(a.turno) - turnosOrden.indexOf(b.turno);
    });
  }, [sugerencia]);

  const totalCompra = detalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setAnio(year);
    setMes(month);
  };

  const fetchSugerencia = async () => {
    setLoadingSuggestion(true);
    try {
      const res = await fetch(`/api/compras/sugerencia?anio=${anio}&mes=${mes}&semana=${semana}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSugerencia(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const agregarItem = () => {
    setDetalles([...detalles, { insumo_id: 0, cantidad: 1, precio_unitario: 0 }]);
  };

  const removerItem = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarItem = (index: number, field: keyof ItemDetalle, value: number) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const copiarSugerencia = () => {
    const items = (sugerencia?.items || [])
      .filter(item => item.sugerido > 0)
      .map(item => ({
        insumo_id: item.insumo_id,
        cantidad: item.sugerido,
        precio_unitario: detalles.find(det => det.insumo_id === item.insumo_id)?.precio_unitario || 0
      }));

    if (items.length === 0) {
      setError('No hay cantidades sugeridas para copiar');
      return;
    }

    setDetalles(items);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!proveedorId) return setError('Seleccione un proveedor');
    if (detalles.length === 0) return setError('Agregue al menos un insumo');
    if (detalles.some(d => d.insumo_id === 0 || d.cantidad <= 0 || d.precio_unitario < 0)) {
      return setError('Verifique que todos los items tengan insumo y cantidades válidas');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/compras', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          proveedor_id: proveedorId,
          fecha,
          total: totalCompra,
          detalles
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar la compra');
      }

      navigate('/compras');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Registrar compra con sugerencia</h2>
          <p style={{ color: 'var(--text-muted)' }}>Menú semanal, necesidad sugerida y grilla de compra en una sola pantalla.</p>
        </div>
        <Link to="/compras" className="btn-secondary">Cancelar</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(520px, 1.25fr) minmax(360px, 0.9fr)', gap: '1rem', alignItems: 'start' }}>
          <aside className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ShoppingCart size={18} /> Compra
            </h3>

            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <select
                className="input-field"
                value={proveedorId}
                onChange={e => setProveedorId(Number(e.target.value))}
                required
              >
                <option value="">Seleccione...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha compra</label>
              <input className="input-field" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Mes del menú</label>
              <input
                className="input-field"
                type="month"
                value={`${anio}-${String(mes).padStart(2, '0')}`}
                onChange={event => handleMonthChange(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Semana</label>
              <select className="input-field" value={semana} onChange={e => setSemana(Number(e.target.value))}>
                {semanas.map(item => <option key={item} value={item}>Semana {item}</option>)}
              </select>
            </div>

            <button type="button" className="btn-secondary" onClick={fetchSugerencia} style={{ width: '100%', marginBottom: '0.75rem' }}>
              Actualizar sugerencia
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', height: '46px', fontSize: '0.95rem' }}
              disabled={loading}
            >
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar compra'}
            </button>

            {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}
          </aside>

          <section className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grilla de compra</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ajusta cantidades y precios antes de guardar.</p>
              </div>
              <button type="button" onClick={agregarItem} className="btn-primary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}>
                <Plus size={16} /> Fila
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 110px 110px 36px', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>Insumo</span>
              <span>Unidad</span>
              <span>Cantidad</span>
              <span>Precio</span>
              <span></span>
            </div>

            <AnimatePresence>
              {detalles.map((item, index) => {
                const insumo = insumoById.get(item.insumo_id);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 90px 110px 110px 36px', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}
                  >
                    <select
                      className="input-field"
                      value={item.insumo_id}
                      onChange={e => actualizarItem(index, 'insumo_id', Number(e.target.value))}
                    >
                      <option value="0">Seleccione...</option>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{insumo?.unidad_medida || '-'}</span>
                    <input
                      type="number"
                      className="input-field"
                      value={item.cantidad}
                      min="0"
                      step="0.01"
                      onChange={e => actualizarItem(index, 'cantidad', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      className="input-field"
                      value={item.precio_unitario}
                      min="0"
                      step="0.01"
                      onChange={e => actualizarItem(index, 'precio_unitario', Number(e.target.value))}
                    />
                    <button type="button" onClick={() => removerItem(index)} style={{ background: 'transparent', color: 'var(--danger-color)', padding: '0.5rem', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {detalles.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Agrega filas manualmente o copia la sugerencia.</p>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total compra</span>
              <strong style={{ fontSize: '1.45rem' }}>{formatMoney(totalCompra)}</strong>
            </div>
          </section>

          <aside style={{ display: 'grid', gap: '1rem' }}>
            <section className="card" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <ClipboardList size={18} /> Menú semana {semana}
              </h3>
              {menuItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay menú cargado para esta semana.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {menuItems.map(item => (
                    <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <strong>{item.dia}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.turno}</span>
                      </div>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>{item.plato.nombre}</p>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.porciones_estimadas} porciones</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Sugerencia de compra</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Requerido - existencia - en orden.</p>
                </div>
                <button type="button" className="btn-primary" onClick={copiarSugerencia} style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}>
                  Copiar
                </button>
              </div>

              {loadingSuggestion ? (
                <p style={{ color: 'var(--text-muted)' }}>Calculando...</p>
              ) : (sugerencia?.items.length || 0) === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin sugerencias para esta semana.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-container">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Req</th>
                        <th>Ex</th>
                        <th>Ord</th>
                        <th>Sug</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sugerencia?.items.map(item => (
                        <tr key={item.insumo_id}>
                          <td>
                            <strong>{item.nombre}</strong><br />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.unidad}</span>
                          </td>
                          <td>{item.requerido}</td>
                          <td>{item.existencia}</td>
                          <td>{item.enOrden}</td>
                          <td><strong>{item.sugerido}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </aside>
        </div>
      </form>
    </motion.div>
  );
};

export default NuevaCompraForm;
