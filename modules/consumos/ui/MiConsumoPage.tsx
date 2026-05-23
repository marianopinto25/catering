import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@core/AuthContext';
import SignaturePad from './SignaturePad';

interface Consumo {
  id: number;
  fecha: string;
  turno: string;
  metodo: string;
  registrado_en?: string;
  firmaBase64?: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);
const turnos = ['Desayuno', 'Almuerzo', 'Cena'];

const MiConsumoPage: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [fecha] = useState(today());
  const initialTurno = searchParams.get('turno') || 'Almuerzo';
  const [turno, setTurno] = useState(turnos.includes(initialTurno) ? initialTurno : 'Almuerzo');
  const [metodo, setMetodo] = useState<'SESION' | 'QR'>('SESION');
  const [codigoQr, setCodigoQr] = useState('');
  const [consumo, setConsumo] = useState<Consumo | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadMiConsumo = async () => {
    setError('');
    const res = await fetch(`/api/consumos/mio?fecha=${fecha}&turno=${encodeURIComponent(turno)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo consultar tu consumo');
    setConsumo(data);
    setMessage(data ? 'Ya registraste este turno hoy.' : '');
  };

  useEffect(() => {
    if (!token) return;
    loadMiConsumo().catch((err: any) => setError(err.message));
  }, [token, turno]);

  const registrar = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/consumos/mio', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          turno,
          metodo,
          codigo_qr: metodo === 'QR' ? codigoQr.trim() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar el consumo');
      setConsumo(data);
      setMessage('Consumo registrado. Firma para completar el registro.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarFirma = async (firmaBase64: string) => {
    if (!consumo) return;
    const res = await fetch(`/api/consumos/${consumo.id}/firma`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ firmaBase64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la firma');
    setConsumo({ ...consumo, firmaBase64 });
    setMessage('Firma guardada correctamente.');
  };

  const firmado = Boolean(consumo?.firmaBase64);
  const qrRequired = metodo === 'QR' && !codigoQr.trim();

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem', maxWidth: '920px' }}>
      <div>
        <h2>Mi Consumo</h2>
        <p style={{ color: 'var(--text-muted)' }}>Registra la comida que consumiste hoy y firma dentro del sistema.</p>
      </div>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 0.5fr) minmax(220px, 0.7fr) 1fr', gap: '0.9rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="input-field" value={fecha} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)} disabled={loading}>
              {turnos.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Método</label>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              {(['SESION', 'QR'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMetodo(option)}
                  disabled={loading || Boolean(consumo)}
                  style={{
                    border: 0,
                    padding: '0.75rem 1rem',
                    background: metodo === option ? 'var(--primary-color)' : 'var(--input-bg)',
                    color: metodo === option ? 'var(--secondary-color)' : 'var(--text-primary)',
                    cursor: consumo ? 'not-allowed' : 'pointer',
                    fontWeight: 800
                  }}
                >
                  {option === 'SESION' ? 'Sesión' : 'QR'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {metodo === 'QR' && (
          <div className="form-group">
            <label className="form-label">Código QR</label>
            <input
              className="input-field"
              value={codigoQr}
              onChange={e => setCodigoQr(e.target.value)}
              placeholder="Pega el código QR asignado por la empresa"
              disabled={Boolean(consumo)}
            />
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: firmado ? 'var(--success-color)' : 'var(--text-primary)', fontWeight: 800 }}>{message}</p>}

        <button className="btn-primary" type="button" onClick={registrar} disabled={loading || Boolean(consumo) || qrRequired} style={{ width: 'fit-content' }}>
          <ClipboardCheck size={16} /> {loading ? 'Registrando...' : consumo ? 'Consumo registrado' : 'Registrar consumo'}
        </button>
      </section>

      {consumo && (
        <section className="card" style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3>Consumo #{consumo.id}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{consumo.fecha} · {consumo.turno} · {consumo.metodo}</p>
            </div>
            {firmado && <span style={{ color: 'var(--success-color)', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={18} /> Firmado</span>}
          </div>
          {firmado ? (
            <img src={consumo.firmaBase64 || ''} alt="Firma guardada" style={{ maxWidth: '360px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)' }} />
          ) : (
            <SignaturePad title="Firma del trabajador" onSave={guardarFirma} />
          )}
        </section>
      )}
    </motion.div>
  );
};

export default MiConsumoPage;
