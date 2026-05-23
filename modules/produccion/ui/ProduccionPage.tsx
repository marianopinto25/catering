import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ClipboardList, PackageX, RefreshCw } from 'lucide-react';
import { useAuth } from '@core/AuthContext';

interface Plato {
  id: number;
  nombre: string;
  receta: Array<{
    id: number;
    cantidad_por_porcion: number;
    unidad_medida: string;
    insumo: { nombre: string };
  }>;
}

interface Produccion {
  id: number;
  fecha: string;
  turno?: string;
  porciones: number;
  plato: { nombre: string };
  detalles: Array<{
    id: number;
    cantidad: number;
    unidad_medida: string;
    lote_snapshot?: string | null;
    fecha_vencimiento_snapshot?: string | null;
    insumo: { nombre: string };
  }>;
}

interface KardexItem {
  id: number;
  fecha: string;
  tipo_movimiento: string;
  cantidad: number;
  motivo?: string;
  insumo: { nombre: string; unidad_medida: string };
  inventario?: { lote?: string | null; fecha_vencimiento?: string | null };
  usuario: { nombre: string };
}

const today = () => new Date().toISOString().slice(0, 10);

const ProduccionPage: React.FC = () => {
  const { token, user } = useAuth();
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [kardex, setKardex] = useState<KardexItem[]>([]);
  const [platoId, setPlatoId] = useState('');
  const [porciones, setPorciones] = useState(1);
  const [fecha, setFecha] = useState(today());
  const [turno, setTurno] = useState('Almuerzo');
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [faltantes, setFaltantes] = useState<any[]>([]);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const selectedPlato = platos.find(plato => plato.id === Number(platoId));

  const loadData = async () => {
    const [platosRes, produccionesRes, kardexRes] = await Promise.all([
      fetch('/api/platos', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/produccion', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/produccion/kardex', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    if (platosRes.ok) {
      const data = await platosRes.json();
      setPlatos(data);
      if (!platoId && data[0]) setPlatoId(String(data[0].id));
    }
    if (produccionesRes.ok) setProducciones(await produccionesRes.json());
    if (kardexRes.ok) setKardex(await kardexRes.json());
  };

  useEffect(() => {
    loadData().catch(() => setError('No se pudo cargar producción'));
  }, [token]);

  const registrar = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setFaltantes([]);

    try {
      const res = await fetch('/api/produccion', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          plato_id: Number(platoId),
          porciones,
          fecha,
          turno,
          observacion
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.faltantes) setFaltantes(data.faltantes);
        throw new Error(data.error || 'No se pudo registrar producción');
      }
      setMessage(`Producción #${data.id} registrada con descuento FEFO`);
      setObservacion('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canUse = user?.rol?.toUpperCase() === 'CHEF';
  if (!canUse) return <div className="card"><p className="error-text">Acceso denegado al módulo de producción.</p></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Producción de cocina</h2>
        <p style={{ color: 'var(--text-muted)' }}>Registra preparación por plato, descuenta inventario FEFO y deja Kardex por lote.</p>
      </div>

      <section className="card" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.8fr) minmax(420px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        <form onSubmit={registrar} style={{ display: 'grid', gap: '0.9rem' }}>
          <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><ChefHat size={20} /> Registrar producción</h3>
          <div className="form-group">
            <label className="form-label">Plato</label>
            <select className="input-field" value={platoId} onChange={e => setPlatoId(e.target.value)} required>
              {platos.map(plato => <option key={plato.id} value={plato.id}>{plato.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Porciones</label>
              <input className="input-field" type="number" min={1} value={porciones} onChange={e => setPorciones(Number(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input className="input-field" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)}>
              <option>Desayuno</option>
              <option>Almuerzo</option>
              <option>Cena</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Observación</label>
            <textarea className="input-field" value={observacion} onChange={e => setObservacion(e.target.value)} rows={3} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading || !platoId}>
            <ClipboardList size={16} /> {loading ? 'Registrando...' : 'Registrar producción'}
          </button>
          {message && <p style={{ color: 'var(--success-color)', fontWeight: 800 }}>{message}</p>}
          {error && <p className="error-text">{error}</p>}
        </form>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <h3>Receta requerida</h3>
            <p style={{ color: 'var(--text-muted)' }}>Cantidad calculada para {porciones || 0} porciones.</p>
          </div>
          {(selectedPlato?.receta || []).map(item => (
            <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>{item.insumo.nombre}</span>
              <strong>{Number((item.cantidad_por_porcion * porciones).toFixed(3))} {item.unidad_medida}</strong>
            </div>
          ))}
          {faltantes.length > 0 && (
            <div style={{ border: '1px solid var(--danger-color)', borderRadius: '8px', padding: '1rem', background: 'var(--danger-bg)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-color)' }}><PackageX size={18} /> Faltantes</h4>
              {faltantes.map(item => (
                <p key={item.insumo_id} style={{ color: 'var(--danger-color)', marginTop: '0.45rem' }}>
                  {item.nombre}: requerido {item.requerido} {item.unidad_medida}, disponible {item.disponible}, falta {item.faltante}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Producciones recientes</h3>
          <button className="btn-secondary" type="button" onClick={loadData}><RefreshCw size={16} /> Actualizar</button>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {producciones.slice(0, 8).map(prod => (
            <article key={prod.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'grid', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <strong>#{prod.id} · {prod.plato.nombre}</strong>
                <span>{prod.fecha} · {prod.turno || 'Sin turno'} · {prod.porciones} porciones</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {prod.detalles.map(det => (
                  <span key={det.id} style={{ borderRadius: '8px', background: 'var(--soft-bg)', padding: '0.45rem 0.65rem', fontSize: '0.88rem' }}>
                    {det.insumo.nombre}: {det.cantidad} {det.unidad_medida} · {det.lote_snapshot || 'Sin lote'}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <h3>Kardex reciente</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem' }}>Insumo</th>
                <th style={{ padding: '0.75rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem' }}>Cantidad</th>
                <th style={{ padding: '0.75rem' }}>Lote</th>
                <th style={{ padding: '0.75rem' }}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {kardex.slice(0, 20).map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>{new Date(item.fecha).toLocaleString('es-BO')}</td>
                  <td style={{ padding: '0.75rem' }}>{item.insumo.nombre}</td>
                  <td style={{ padding: '0.75rem' }}>{item.tipo_movimiento}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 800 }}>{item.cantidad} {item.insumo.unidad_medida}</td>
                  <td style={{ padding: '0.75rem' }}>{item.inventario?.lote || '-'}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{item.motivo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};

export default ProduccionPage;
