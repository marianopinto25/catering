import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Search, UserPlus } from 'lucide-react';
import { useAuth } from '@core/AuthContext';
import SignaturePad from './SignaturePad';

interface Trabajador {
  id: number;
  ci: string;
  codigo_qr?: string | null;
  nombres: string;
  apellidos: string;
  cliente?: { razon_social: string };
}

interface Consumo {
  id: number;
  fecha: string;
  turno: string;
  estado_firma: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const ConsumoPage: React.FC = () => {
  const { token, role } = useAuth();
  const [searchParams] = useSearchParams();
  const [fecha, setFecha] = useState(today());
  const [turno, setTurno] = useState('Almuerzo');
  const [metodo, setMetodo] = useState<'CI' | 'QR'>('CI');
  const [query, setQuery] = useState('');
  const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
  const [consumo, setConsumo] = useState<Consumo | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const buscar = async (override?: { metodo?: 'CI' | 'QR'; query?: string }) => {
    const currentMetodo = override?.metodo || metodo;
    const currentQuery = override?.query ?? query;
    setLoading(true);
    setError('');
    setStatus('');
    setTrabajador(null);
    setConsumo(null);
    try {
      const param = currentMetodo === 'CI' ? `ci=${encodeURIComponent(currentQuery.trim())}` : `qr=${encodeURIComponent(currentQuery.trim())}`;
      const res = await fetch(`/api/trabajadores?${param}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Trabajador no encontrado');
      setTrabajador(data);
      setStatus('Trabajador validado');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qr = searchParams.get('qr');
    if (!qr || !token) return;
    setMetodo('QR');
    setQuery(qr);
    buscar({ metodo: 'QR', query: qr });
  }, [searchParams, token]);

  const registrarConsumo = async () => {
    if (!trabajador) return;
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const res = await fetch('/api/consumos', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          trabajador_id: trabajador.id,
          fecha,
          turno,
          metodo_identificacion: metodo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar consumo');
      setConsumo(data);
      setStatus('Consumo registrado. Capture la firma del trabajador.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarFirma = async (firma_base64: string) => {
    if (!consumo) return;
    const res = await fetch(`/api/consumos/${consumo.id}/firma`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ firma_base64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar firma');
    setConsumo({ ...consumo, estado_firma: 'Firmado' });
    setStatus('Firma guardada. El consumo ya aparece firmado en el reporte diario.');
  };

  const canOperate = role === 'CLIENTE' || role === 'GERENTE';

  if (!canOperate) {
    return <div className="card"><p className="error-text">Acceso denegado al módulo de consumo.</p></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Consumo de comensales</h2>
        <p style={{ color: 'var(--text-muted)' }}>Abra el QR del trabajador o identifique por CI para registrar la comida consumida hoy.</p>
      </div>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 220px 1fr', gap: '0.9rem' }}>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="input-field" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
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
            <label className="form-label">Método</label>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
              {(['CI', 'QR'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setMetodo(option);
                    setQuery('');
                    setTrabajador(null);
                    setConsumo(null);
                    setError('');
                    setStatus('');
                  }}
                  style={{
                    border: 0,
                    padding: '0.75rem 1.1rem',
                    background: metodo === option ? 'var(--primary-color)' : 'var(--input-bg)',
                    color: metodo === option ? 'var(--secondary-color)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 800
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">{metodo === 'CI' ? 'CI' : 'Código QR o enlace escaneado'}</label>
            <input
              className="input-field"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={metodo === 'CI' ? 'Ej: 1234567' : 'Escanee o pegue el QR del trabajador'}
              onKeyDown={e => e.key === 'Enter' && buscar()}
            />
          </div>
          <button className="btn-primary" type="button" onClick={() => buscar()} disabled={loading || !query.trim()}>
            <Search size={16} /> {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {error && (
          <div style={{ border: '1px solid var(--danger-color)', borderRadius: '8px', padding: '0.9rem', background: 'var(--danger-bg)', color: 'var(--danger-color)', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
            <strong>{error}</strong>
            {role === 'GERENTE' && (
              <Link to="/comedor/trabajadores" className="btn-secondary">
                <UserPlus size={16} /> Registrar trabajador
              </Link>
            )}
          </div>
        )}
        {status && <p style={{ color: 'var(--success-color)', fontWeight: 800 }}>{status}</p>}
      </section>

      {trabajador && (
        <section className="card" style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3>{trabajador.nombres} {trabajador.apellidos}</h3>
              <p style={{ color: 'var(--text-muted)' }}>CI {trabajador.ci} · QR {trabajador.codigo_qr || '-'} · {trabajador.cliente?.razon_social || 'Sin cliente'}</p>
            </div>
            <button className="btn-primary" type="button" onClick={registrarConsumo} disabled={loading || !!consumo}>
              <CheckCircle2 size={16} /> {consumo ? 'Consumo registrado' : 'Registrar consumo'}
            </button>
          </div>
          {consumo && (
            <SignaturePad
              title={`Firma del trabajador para consumo #${consumo.id}`}
              onSave={guardarFirma}
              disabled={consumo.estado_firma === 'Firmado'}
            />
          )}
        </section>
      )}
    </motion.div>
  );
};

export default ConsumoPage;
