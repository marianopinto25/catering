import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileCheck2, Search } from 'lucide-react';
import { useAuth } from '@core/AuthContext';
import SignaturePad from '../../consumos/ui/SignaturePad';

interface ReporteConsumo {
  id: number;
  metodo_identificacion: string;
  registrado_en: string;
  registrado_por: { nombre: string };
  trabajador: {
    ci: string;
    codigo_qr?: string | null;
    nombre_completo: string;
    cliente?: { razon_social: string };
  };
  firma: {
    existe: boolean;
    firma_base64?: string;
    firmado_en?: string;
  };
}

interface Reporte {
  fecha: string;
  turno: string;
  estado: string;
  total_consumos: number;
  consumos: ReporteConsumo[];
  validacion: null | {
    estado: string;
    validado_en: string;
    validado_por: { nombre: string };
    cliente: { razon_social: string };
    firma_base64: string;
  };
}

const today = () => new Date().toISOString().slice(0, 10);

const ReporteDiarioPage: React.FC = () => {
  const { token, user } = useAuth();
  const [fecha, setFecha] = useState(today());
  const [turno, setTurno] = useState('Almuerzo');
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadReporte = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/reportes/diario?fecha=${fecha}&turno=${encodeURIComponent(turno)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar reporte');
      setReporte(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validarReporte = async (firma_base64: string) => {
    const res = await fetch('/api/reportes/diario/validar', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ fecha, turno, firma_base64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo validar reporte');
    setMessage('Reporte validado por el cliente');
    await loadReporte();
  };

  const canView = user?.rol === 'Cliente' || user?.rol === 'Gerente';
  const canValidate = user?.rol === 'Cliente' && reporte?.estado !== 'Validado';

  if (!canView) {
    return <div className="card"><p className="error-text">Acceso denegado al reporte diario.</p></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Reporte diario</h2>
        <p style={{ color: 'var(--text-muted)' }}>Consumos firmados por fecha y turno, con validación final del cliente.</p>
      </div>

      <section className="card" style={{ display: 'grid', gridTemplateColumns: '180px 220px auto 1fr', gap: '0.9rem', alignItems: 'end' }}>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input type="date" className="input-field" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Turno</label>
          <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)}>
            <option>Desayuno</option>
            <option>Almuerzo</option>
            <option>Cena</option>
          </select>
        </div>
        <button className="btn-primary" type="button" onClick={loadReporte} disabled={loading}>
          <Search size={16} /> {loading ? 'Consultando...' : 'Consultar'}
        </button>
        {reporte && (
          <div style={{ justifySelf: 'end', display: 'inline-flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Total: {reporte.total_consumos}</span>
            <span style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.55rem 0.75rem', fontWeight: 800, color: reporte.estado === 'Validado' ? 'var(--success-color)' : 'var(--text-primary)' }}>
              {reporte.estado}
            </span>
          </div>
        )}
      </section>

      {error && <p className="error-text">{error}</p>}
      {message && <p style={{ color: 'var(--success-color)', fontWeight: 800 }}>{message}</p>}

      {reporte && (
        <section className="card" style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h3>{reporte.turno} · {reporte.fecha}</h3>
              <p style={{ color: 'var(--text-muted)' }}>Lista de consumos registrados y firmas del trabajador.</p>
            </div>
            {reporte.estado === 'Validado' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', fontWeight: 900 }}><CheckCircle2 size={18} /> Validado</span>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>CI</th>
                  <th style={{ padding: '0.75rem' }}>Trabajador</th>
                  <th style={{ padding: '0.75rem' }}>Método</th>
                  <th style={{ padding: '0.75rem' }}>Registrado por</th>
                  <th style={{ padding: '0.75rem' }}>Firma</th>
                </tr>
              </thead>
              <tbody>
                {reporte.consumos.map(consumo => (
                  <tr key={consumo.id} style={{ borderTop: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>{consumo.trabajador.ci}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{consumo.trabajador.nombre_completo}</strong>
                      <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{consumo.trabajador.cliente?.razon_social || '-'}</p>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{consumo.metodo_identificacion}</td>
                    <td style={{ padding: '0.75rem' }}>{consumo.registrado_por.nombre}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {consumo.firma.existe && consumo.firma.firma_base64 ? (
                        <img src={consumo.firma.firma_base64} alt="Firma del trabajador" style={{ width: '180px', height: '72px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fff' }} />
                      ) : (
                        <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reporte.consumos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Sin consumos para este turno.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {reporte?.validacion && (
        <section className="card" style={{ display: 'grid', gap: '1rem' }}>
          <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><FileCheck2 size={20} /> Validación del cliente</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {reporte.validacion.cliente.razon_social} · {reporte.validacion.validado_por.nombre} · {new Date(reporte.validacion.validado_en).toLocaleString()}
          </p>
          <img src={reporte.validacion.firma_base64} alt="Firma del cliente" style={{ width: '280px', height: '120px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fff' }} />
        </section>
      )}

      {reporte && canValidate && (
        <section className="card">
          <SignaturePad title="Firma del cliente para validar reporte" onSave={validarReporte} />
        </section>
      )}
    </motion.div>
  );
};

export default ReporteDiarioPage;
