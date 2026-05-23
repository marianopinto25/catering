import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@core/AuthContext';
import { Bot, ChevronDown, ClipboardList, Plus, Save, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { formatMoney } from '@core/format';

interface Insumo {
  id: number;
  nombre: string;
  marca?: string;
  unidad_medida: string;
  precio_unitario?: number;
  proveedores_disponibles?: {
    id: number;
    razon_social: string;
    precio_unitario: number;
    es_preferido?: boolean;
  }[];
  proveedor_preferido?: {
    id: number;
    razon_social: string;
    precio_unitario: number;
  } | null;
}

interface ItemDetalle {
  insumo_id: number;
  cantidad: number | '';
  precio_unitario: number | '';
  proveedor_id?: number | null;
  proveedor_nombre?: string;
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
  faltante: number;
  vida_util_dias: number;
  limite_perecible: number;
  criterio?: string;
  razon_sugerencia?: string;
  usado_en?: string[];
  proveedor_id?: number | null;
  proveedor_nombre?: string;
  precio_unitario?: number;
}

interface SugerenciaCompra {
  anio: number;
  mes: number;
  semana: number;
  menu: { id: number; estado: string; items: MenuSemanaItem[] } | null;
  items: SugerenciaItem[];
}

const semanas = [1, 2, 3, 4];
const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const turnosOrden = [
  'Desayuno',
  'Desayuno - Bebida',
  'Almuerzo - Sopa',
  'Almuerzo',
  'Almuerzo - Segundo',
  'Almuerzo - Bebida',
  'Cena',
  'Cena - Bebida'
];

const toDateTimeLocal = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const NuevaCompraForm: React.FC = () => {
  const now = new Date();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [fecha, setFecha] = useState(toDateTimeLocal(now));
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [semana, setSemana] = useState(1);
  const [detalles, setDetalles] = useState<ItemDetalle[]>([]);
  const [sugerencia, setSugerencia] = useState<SugerenciaCompra | null>(null);
  const [error, setError] = useState('');
  const [suggestionError, setSuggestionError] = useState('');
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenuDay, setOpenMenuDay] = useState<string | null>(null);
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
        const resIns = await fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } });
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

  useEffect(() => {
    const selectedDate = new Date(fecha);
    if (!Number.isNaN(selectedDate.getTime())) {
      setAnio(selectedDate.getFullYear());
      setMes(selectedDate.getMonth() + 1);
    }
  }, [fecha]);

  const insumoById = useMemo(() => {
    const map = new Map<number, Insumo>();
    for (const insumo of insumos) map.set(insumo.id, insumo);
    return map;
  }, [insumos]);

  const menuItems = useMemo(() => {
    const items = sugerencia?.menu?.items || [];
    return [...items].sort((a, b) => {
      if (a.dia !== b.dia) return diasOrden.indexOf(a.dia) - diasOrden.indexOf(b.dia);
      return turnosOrden.indexOf(a.turno) - turnosOrden.indexOf(b.turno);
    });
  }, [sugerencia]);

  const menuByDay = useMemo(() => {
    const map = new Map<string, MenuSemanaItem[]>();
    for (const item of menuItems) {
      const current = map.get(item.dia) || [];
      current.push(item);
      map.set(item.dia, current);
    }
    return Array.from(map.entries());
  }, [menuItems]);

  useEffect(() => {
    if (!menuByDay.length || !menuOpen) setOpenMenuDay(null);
  }, [menuByDay.length, menuOpen]);

  const totalCompra = detalles.reduce((acc, curr) => {
    const cantidad = Number(curr.cantidad) || 0;
    const precio = Number(curr.precio_unitario) || 0;
    return acc + (cantidad * precio);
  }, 0);

  const fetchSugerencia = async () => {
    setLoadingSuggestion(true);
    setSuggestionError('');
    try {
      const res = await fetch(`/api/compras/sugerencia?anio=${anio}&mes=${mes}&semana=${semana}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSugerencia(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setSugerencia(null);
        setSuggestionError(data.error || 'No se pudo calcular la sugerencia');
      }
    } catch (e: any) {
      console.error(e);
      setSugerencia(null);
      setSuggestionError('No se pudo conectar con el servicio de sugerencia');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const agregarItem = () => {
    setDetalles([...detalles, { insumo_id: 0, cantidad: 1, precio_unitario: '', proveedor_id: null, proveedor_nombre: '' }]);
  };

  const removerItem = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarInsumoItem = (index: number, insumoId: number) => {
    const insumo = insumoById.get(insumoId);
    const proveedor = insumo?.proveedor_preferido || insumo?.proveedores_disponibles?.[0] || null;
    const newDetalles = [...detalles];
    newDetalles[index] = {
      ...newDetalles[index],
      insumo_id: insumoId,
      proveedor_id: proveedor?.id || null,
      proveedor_nombre: proveedor?.razon_social || 'Sin proveedor configurado',
      precio_unitario: proveedor?.precio_unitario
        ? Number(proveedor.precio_unitario)
        : insumo?.precio_unitario
          ? Number(insumo.precio_unitario)
          : ''
    };
    setDetalles(newDetalles);
  };

  const actualizarProveedorItem = (index: number, proveedorId: number) => {
    const item = detalles[index];
    const insumo = insumoById.get(item.insumo_id);
    const proveedor = insumo?.proveedores_disponibles?.find(prov => prov.id === proveedorId);
    const newDetalles = [...detalles];
    newDetalles[index] = {
      ...newDetalles[index],
      proveedor_id: proveedor?.id || null,
      proveedor_nombre: proveedor?.razon_social || 'Sin proveedor configurado',
      precio_unitario: proveedor?.precio_unitario ? Number(proveedor.precio_unitario) : ''
    };
    setDetalles(newDetalles);
  };

  const actualizarNumeroItem = (index: number, field: 'cantidad', value: string) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value === '' ? '' : Number(value) };
    setDetalles(newDetalles);
  };

  const getTotalItem = (item: ItemDetalle) => {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precio_unitario) || 0;
    return Number((cantidad * precio).toFixed(2));
  };

  const copiarSugerencia = () => {
    const items: ItemDetalle[] = (sugerencia?.items || [])
      .filter(item => item.sugerido > 0)
      .map(item => {
        const insumo = insumoById.get(item.insumo_id);
        const proveedor = item.proveedor_id
          ? insumo?.proveedores_disponibles?.find(prov => prov.id === item.proveedor_id)
          : (insumo?.proveedor_preferido || insumo?.proveedores_disponibles?.[0]);
        return {
          insumo_id: item.insumo_id,
          cantidad: item.sugerido,
          proveedor_id: proveedor?.id || item.proveedor_id || null,
          proveedor_nombre: proveedor?.razon_social || item.proveedor_nombre || 'Sin proveedor configurado',
          precio_unitario: proveedor?.precio_unitario
            ? Number(proveedor.precio_unitario)
            : item.precio_unitario
              ? Number(item.precio_unitario)
              : ''
        };
      });

    if (items.length === 0) {
      setError('No hay cantidades sugeridas para copiar');
      return;
    }

    setDetalles(items);
    setError('');
  };

  const selectSemana = (value: number) => {
    setSemana(value);
    setMenuPickerOpen(false);
    setMenuOpen(false);
    setOpenMenuDay(null);
  };

  const monthLabel = new Date(anio, mes - 1, 1).toLocaleDateString('es-BO', {
    month: 'long',
    year: 'numeric'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (detalles.length === 0) return setError('Agregue al menos un insumo');
    if (detalles.some(d => d.insumo_id === 0 || Number(d.cantidad) <= 0)) {
      return setError('Verifique que todos los items tengan insumo y cantidades válidas');
    }
    if (detalles.some(d => Number(d.precio_unitario) <= 0)) {
      return setError('Todos los insumos deben tener precio definido por su proveedor preferido');
    }
    if (detalles.some(d => !d.proveedor_id)) {
      return setError('Todos los insumos deben tener proveedor preferido configurado');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/compras/generar-desde-sugerencia', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fecha: new Date(fecha).toISOString(),
          detalles: detalles.map(detalle => ({
            ...detalle,
            cantidad: Number(detalle.cantidad)
          }))
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
        <div className="purchase-layout">
          <aside className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ShoppingCart size={18} /> Compra
            </h3>

            <div style={{ border: '1px solid #dbeafe', borderRadius: '8px', padding: '0.85rem', background: '#eff6ff', marginBottom: '1rem' }}>
              <strong style={{ display: 'block' }}>Proveedor por insumo</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.25rem' }}>
                Cada producto puede usar su proveedor sugerido o uno alternativo si está configurado.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha y hora compra</label>
              <input className="input-field" type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Menú a usar para sugerir</label>
              <button
                type="button"
                className="input-field"
                onClick={() => setMenuPickerOpen(prev => !prev)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer', height: 'auto', minHeight: 58 }}
              >
                <span>
                  <strong style={{ display: 'block' }}>Menú semana {semana}</strong>
                  <small style={{ color: 'var(--text-muted)' }}>{monthLabel}</small>
                </span>
                <ChevronDown size={18} className={menuPickerOpen ? 'menu-chevron is-open' : 'menu-chevron'} />
              </button>

              <AnimatePresence initial={false}>
                {menuPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{ marginTop: '0.55rem', display: 'grid', gap: '0.5rem' }}
                  >
                    {semanas.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectSemana(item)}
                        style={{
                          border: `1px solid ${item === semana ? '#0f172a' : 'var(--border-color)'}`,
                          background: item === semana ? '#0f172a' : '#fff',
                          color: item === semana ? '#fff' : 'var(--text-primary)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <strong>Menú semana {item}</strong>
                        <span style={{ display: 'block', fontSize: '0.82rem', color: item === semana ? '#dbeafe' : 'var(--text-muted)' }}>
                          Usar esta semana para calcular faltantes
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="button" className="btn-secondary" onClick={fetchSugerencia} style={{ width: '100%', marginBottom: '0.75rem' }} disabled={loadingSuggestion}>
              {loadingSuggestion ? 'Analizando menú...' : 'Recalcular sugerencia'}
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', height: '46px', fontSize: '0.95rem' }}
              disabled={loading}
            >
              <Save size={18} /> {loading ? 'Generando...' : 'Generar compras por proveedor'}
            </button>

            {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}
          </aside>

          <div className="purchase-workspace">
          <section className="card purchase-grid-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grilla de compra</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ajusta cantidades y proveedor; el precio viene del catálogo.</p>
              </div>
              <button type="button" onClick={agregarItem} className="btn-primary" style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}>
                <Plus size={16} /> Fila
              </button>
            </div>

            <div className="purchase-items-list">
              <AnimatePresence>
                {detalles.map((item, index) => {
                  const insumo = insumoById.get(item.insumo_id);
                  const proveedores = insumo?.proveedores_disponibles || [];
                  const selectedProveedor = proveedores.find(prov => prov.id === item.proveedor_id);
                  return (
                    <motion.article
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="purchase-item-card"
                    >
                      <div className="purchase-item-top">
                        <div className="purchase-field purchase-field-insumo">
                          <label className="form-label">Insumo</label>
                          <select
                            className="input-field"
                            value={item.insumo_id}
                            onChange={e => actualizarInsumoItem(index, Number(e.target.value))}
                          >
                            <option value="0">Seleccione...</option>
                            {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} - {i.marca || 'Genérica'}</option>)}
                          </select>
                        </div>

                        <div className="purchase-field">
                          <label className="form-label">Proveedor</label>
                          <select
                            className="input-field"
                            value={item.proveedor_id || ''}
                            onChange={e => actualizarProveedorItem(index, Number(e.target.value))}
                            disabled={!insumo || proveedores.length === 0}
                            title={proveedores.length <= 1 ? 'Este insumo solo tiene un proveedor configurado' : 'Elige el proveedor para este insumo'}
                          >
                            <option value="">Sin proveedor</option>
                            {proveedores.map(proveedor => (
                              <option key={proveedor.id} value={proveedor.id}>
                                {proveedor.razon_social}{proveedor.es_preferido ? ' · preferido' : ''}
                              </option>
                            ))}
                          </select>
                          <small className={item.proveedor_id ? 'purchase-help' : 'purchase-help is-danger'}>
                            {item.proveedor_id
                              ? `${proveedores.length > 1 ? 'Puedes cambiarlo' : 'Proveedor único'} · ${selectedProveedor ? formatMoney(selectedProveedor.precio_unitario) : formatMoney(Number(item.precio_unitario) || 0)}`
                              : 'Configura proveedor para comprar este insumo'}
                          </small>
                        </div>

                        <button
                          type="button"
                          aria-label="Quitar fila"
                          onClick={() => removerItem(index)}
                          className="purchase-remove-button"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="purchase-item-numbers">
                        <div className="purchase-field">
                          <label className="form-label">Cantidad</label>
                          <input
                            type="number"
                            className="input-field"
                            value={item.cantidad}
                            min="0"
                            step="0.01"
                            onChange={e => actualizarNumeroItem(index, 'cantidad', e.target.value)}
                          />
                        </div>
                        <div className="purchase-readonly-box">
                          <span>Unidad</span>
                          <strong>{insumo?.unidad_medida || '-'}</strong>
                        </div>
                        <div className="purchase-readonly-box">
                          <span>Precio unit. Bs</span>
                          <strong>{item.precio_unitario === '' ? '-' : formatMoney(Number(item.precio_unitario))}</strong>
                        </div>
                        <div className="purchase-readonly-box">
                          <span>Total insumo Bs</span>
                          <strong>{item.cantidad === '' || item.precio_unitario === '' ? '-' : formatMoney(getTotalItem(item))}</strong>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>

            {detalles.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Agrega filas manualmente o copia la sugerencia.</p>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total estimado</span>
              <strong style={{ fontSize: '1.45rem' }}>{formatMoney(totalCompra)}</strong>
            </div>
          </section>

            <section className="card purchase-suggestion-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Sugerencia de compra</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Basado en menú semana {semana}, inventario actual y compras pendientes.
                  </p>
                </div>
                <button type="button" className="btn-primary" onClick={copiarSugerencia} style={{ padding: '0.55rem 0.8rem', fontSize: '0.84rem', whiteSpace: 'normal' }}>
                  Copiar sugerencia a la compra
                </button>
              </div>

              {loadingSuggestion ? (
                <p style={{ color: 'var(--text-muted)' }}>Calculando...</p>
              ) : suggestionError ? (
                <p className="error-text" style={{ marginTop: 0 }}>{suggestionError}</p>
              ) : (sugerencia?.items.length || 0) === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin sugerencias para esta semana.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {sugerencia?.items.map(item => (
                    <article key={item.insumo_id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.9rem', background: item.sugerido > 0 ? '#fff' : '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem' }}>{item.nombre}</strong>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                            {item.usado_en?.slice(0, 3).join(' · ') || 'Ingrediente del menú seleccionado'}
                            {(item.usado_en?.length || 0) > 3 ? ` · +${(item.usado_en?.length || 0) - 3} usos` : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Sugerido</span>
                          <strong style={{ display: 'block', fontSize: '1.3rem', color: item.sugerido > 0 ? 'var(--text-primary)' : 'var(--success-color)' }}>
                            {item.sugerido} {item.unidad}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem', marginTop: '0.85rem' }}>
                        {[
                          ['Requerido', item.requerido],
                          ['Inventario', item.existencia],
                          ['En orden', item.enOrden],
                          ['Faltante', item.faltante]
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem' }}>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>{label}</span>
                            <strong>{value} {item.unidad}</strong>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginTop: '0.65rem' }}>
                        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem' }}>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Proveedor</span>
                          <strong>{item.proveedor_nombre || 'Sin proveedor preferido'}</strong>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.65rem' }}>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Precio proveedor</span>
                          <strong>{formatMoney(item.precio_unitario || 0)} / {item.unidad}</strong>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.85rem', border: '1px solid #dbeafe', borderRadius: '8px', padding: '0.75rem', background: '#eff6ff', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#0f172a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                          <Bot size={18} />
                        </div>
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#075985', fontWeight: 800, fontSize: '0.85rem' }}>
                            <Sparkles size={14} /> Agente IA de compras
                          </span>
                          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                            {item.razon_sugerencia || 'Analiza el menú seleccionado, inventario y compras pendientes para explicar la sugerencia.'}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="card purchase-menu-card">
              <div className="purchase-section-heading">
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ClipboardList size={18} /> Menú seleccionado: semana {semana}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Abre el menú y luego despliega el día que quieras revisar.</p>
                </div>
                <span className="purchase-pill">{menuItems.length} servicios</span>
              </div>

              {menuByDay.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay menú cargado para esta semana.</p>
              ) : (
                <>
                  <button type="button" className="menu-main-trigger" onClick={() => setMenuOpen(!menuOpen)}>
                    <span>Ver menú semana {semana}</span>
                    <ChevronDown size={18} className={menuOpen ? 'menu-chevron is-open' : 'menu-chevron'} />
                  </button>
                  <AnimatePresence initial={false}>
                    {menuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="menu-collapse"
                      >
                        <div className="menu-accordion">
                          {menuByDay.map(([dia, items]) => {
                            const isOpen = openMenuDay === dia;
                            return (
                              <div className="menu-day" key={dia}>
                                <button type="button" className="menu-day-trigger" onClick={() => setOpenMenuDay(isOpen ? null : dia)}>
                                  <span>
                                    <strong>{dia}</strong>
                                    <small>{items.length} servicios</small>
                                  </span>
                                  <ChevronDown size={18} className={isOpen ? 'menu-chevron is-open' : 'menu-chevron'} />
                                </button>
                                <AnimatePresence initial={false}>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="menu-day-content"
                                    >
                                      <div className="menu-service-grid">
                                        {items.map(item => (
                                          <div className="menu-service" key={item.id}>
                                            <span>{item.turno}</span>
                                            <strong>{item.plato.nombre}</strong>
                                            <small>{item.porciones_estimadas} porciones</small>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </section>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default NuevaCompraForm;
