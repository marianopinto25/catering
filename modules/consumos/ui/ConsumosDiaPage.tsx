import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@core/AuthContext';

interface Consumo {
  id: number;
  fecha: string;
  turno: string;
  metodo: string;
  registrado_en: string;
  firmaBase64?: string | null;
  trabajador?: {
    ci: string;
    nombre?: string;
    nombres?: string;
    apellidos?: string;
    cliente_empresa?: string;
    cliente?: { razon_social: string };
  };
}

const today = () => new Date().toISOString().slice(0, 10);
const turnos = ['', 'Desayuno', 'Almuerzo', 'Cena'];

const trabajadorNombre = (consumo: Consumo) => {
  const trabajador = consumo.trabajador;
  if (!trabajador) return '-';
  return trabajador.nombre || `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim() || '-';
};

const ConsumosDiaPage: React.FC = () => {
  const { token } = useAuth();
  const [fecha, setFecha] = useState(today());
  const [turno, setTurno] = useState('');
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ fecha });
    if (turno) params.set('turno', turno);
    return params.toString();
  }, [fecha, turno]);

  const loadConsumos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/consumos?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los consumos');
      setConsumos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadConsumos();
  }, [token, query]);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Consumos del día</h2>
        <p style={{ color: 'var(--text-muted)' }}>Consulta los consumos registrados por trabajadores y revisa si ya tienen firma.</p>
      </div>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 220px auto', gap: '0.9rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="input-field" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)}>
              {turnos.map(item => <option key={item} value={item}>{item || 'Todos'}</option>)}
            </select>
          </div>
          <button type="button" className="btn-secondary" onClick={loadConsumos} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Registros</h3>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>{consumos.length} consumos</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Trabajador</th>
                <th style={{ padding: '0.75rem' }}>CI</th>
                <th style={{ padding: '0.75rem' }}>Turno</th>
                <th style={{ padding: '0.75rem' }}>Registro</th>
                <th style={{ padding: '0.75rem' }}>Método</th>
                <th style={{ padding: '0.75rem' }}>Firma</th>
              </tr>
            </thead>
            <tbody>
              {consumos.map(consumo => (
                <tr key={consumo.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 800 }}>{trabajadorNombre(consumo)}</td>
                  <td style={{ padding: '0.75rem' }}>{consumo.trabajador?.ci || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{consumo.turno}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(consumo.registrado_en).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>{consumo.metodo}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {consumo.firmaBase64 ? (
                      <img src={consumo.firmaBase64} alt="Firma del trabajador" style={{ width: '120px', maxHeight: '64px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)' }} />
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
              {!consumos.length && (
                <tr>
                  <td colSpan={6} style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No hay consumos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};

export default ConsumosDiaPage;
