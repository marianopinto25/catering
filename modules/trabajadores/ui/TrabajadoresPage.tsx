import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, KeyRound, QrCode, Save, UserPlus, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '@core/AuthContext';

interface Trabajador {
  id: number;
  ci: string;
  codigo_qr?: string | null;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  cliente_empresa?: string;
  activo?: boolean;
  estado?: string;
  cliente?: { razon_social: string };
  usuarioId?: number | null;
  usuario?: { id: number; email: string; rol: string; nombre: string } | null;
}

const emptyForm = {
  id: 0,
  ci: '',
  nombre: '',
  cliente_empresa: '',
  codigo_qr: '',
  activo: true
};

const emptyCuentaForm = {
  email: '',
  password: '123456'
};

const trabajadorNombre = (trabajador: Trabajador) => (
  trabajador.nombre || `${trabajador.nombres || ''} ${trabajador.apellidos || ''}`.trim() || '-'
);

const TrabajadoresPage: React.FC = () => {
  const { token, role } = useAuth();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [qrTrabajador, setQrTrabajador] = useState<Trabajador | null>(null);
  const [cuentaTrabajador, setCuentaTrabajador] = useState<Trabajador | null>(null);
  const [cuentaForm, setCuentaForm] = useState(emptyCuentaForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadData = async () => {
    const res = await fetch('/api/trabajadores', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar el padrón');
    setTrabajadores(data);
  };

  useEffect(() => {
    if (!token) return;
    loadData().catch((err: any) => setError(err.message));
  }, [token]);

  const edit = (trabajador: Trabajador) => {
    setForm({
      id: trabajador.id,
      ci: trabajador.ci,
      nombre: trabajadorNombre(trabajador),
      cliente_empresa: trabajador.cliente_empresa || trabajador.cliente?.razon_social || '',
      codigo_qr: trabajador.codigo_qr || '',
      activo: trabajador.activo ?? trabajador.estado !== 'Inactivo'
    });
    setMessage('');
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const isEditing = form.id > 0;
      const res = await fetch(isEditing ? `/api/trabajadores/${form.id}` : '/api/trabajadores', {
        method: isEditing ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ci: form.ci,
          nombre: form.nombre,
          cliente_empresa: form.cliente_empresa,
          codigo_qr: form.codigo_qr || undefined,
          activo: form.activo,
          estado: form.activo ? 'Activo' : 'Inactivo'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar trabajador');
      setForm(emptyForm);
      setMessage(isEditing ? 'Trabajador actualizado' : 'Trabajador registrado');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCuenta = (trabajador: Trabajador) => {
    setCuentaTrabajador(trabajador);
    setCuentaForm({
      email: trabajador.usuario?.email || '',
      password: '123456'
    });
    setMessage('');
    setError('');
  };

  const crearCuenta = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cuentaTrabajador) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/trabajadores/${cuentaTrabajador.id}/cuenta`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(cuentaForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la cuenta');
      setCuentaTrabajador(null);
      setCuentaForm(emptyCuentaForm);
      setMessage(`Cuenta creada para ${trabajadorNombre(data)}`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'GERENTE') {
    return <div className="card"><p className="error-text">Acceso denegado. Se requiere rol de Gerente.</p></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Trabajadores</h2>
        <p style={{ color: 'var(--text-muted)' }}>Padrón de trabajadores de la empresa cliente y QR único para registrar consumo.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.8fr) minmax(520px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        <section className="card">
          <h3 style={{ marginBottom: '1rem' }}>{form.id ? 'Editar trabajador' : 'Registrar trabajador'}</h3>
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">CI</label>
              <input className="input-field" value={form.ci} onChange={e => setForm({ ...form, ci: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="input-field" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Empresa cliente</label>
              <input className="input-field" value={form.cliente_empresa} onChange={e => setForm({ ...form, cliente_empresa: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Código QR</label>
              <input className="input-field" value={form.codigo_qr} onChange={e => setForm({ ...form, codigo_qr: e.target.value })} placeholder="Se genera automáticamente si se deja vacío" />
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', fontWeight: 800 }}>
              <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
              Activo
            </label>
            {message && <p style={{ color: 'var(--success-color)', fontWeight: 800 }}>{message}</p>}
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" type="submit" disabled={loading}>
                <Save size={16} /> {loading ? 'Guardando...' : 'Guardar'}
              </button>
              {form.id > 0 && <button className="btn-secondary" type="button" onClick={() => setForm(emptyForm)}>Cancelar</button>}
            </div>
          </form>
        </section>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Listado</h3>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>{trabajadores.length} registros</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>CI</th>
                  <th style={{ padding: '0.75rem' }}>Trabajador</th>
                  <th style={{ padding: '0.75rem' }}>Empresa</th>
                  <th style={{ padding: '0.75rem' }}>Cuenta</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map(trabajador => (
                  <tr key={trabajador.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>{trabajador.ci}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajadorNombre(trabajador)}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.cliente_empresa || trabajador.cliente?.razon_social || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.usuario?.email || 'Sin cuenta'}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.activo ?? trabajador.estado !== 'Inactivo' ? 'Activo' : 'Inactivo'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={() => setQrTrabajador(trabajador)} disabled={!trabajador.codigo_qr}>
                          <QrCode size={15} /> Ver QR
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => openCuenta(trabajador)} disabled={Boolean(trabajador.usuarioId)}>
                          <KeyRound size={15} /> Cuenta
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => edit(trabajador)}>
                          <UserPlus size={15} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {qrTrabajador && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'grid', placeItems: 'center', zIndex: 300 }}>
          <div className="card" style={{ width: 'min(420px, calc(100vw - 2rem))', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div>
                <h3>QR de {trabajadorNombre(qrTrabajador)}</h3>
                <p style={{ color: 'var(--text-muted)' }}>Valor único del trabajador</p>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setQrTrabajador(null)} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', placeItems: 'center', padding: '1rem', background: '#fff', borderRadius: '8px' }}>
              <QRCode value={qrTrabajador.codigo_qr || ''} size={220} />
            </div>
            <code style={{ display: 'block', padding: '0.85rem', borderRadius: '8px', background: 'var(--soft-bg)', wordBreak: 'break-all' }}>
              {qrTrabajador.codigo_qr}
            </code>
            <button className="btn-primary" type="button" onClick={() => navigator.clipboard?.writeText(qrTrabajador.codigo_qr || '')}>
              <Copy size={16} /> Copiar código
            </button>
          </div>
        </div>
      )}

      {cuentaTrabajador && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'grid', placeItems: 'center', zIndex: 300 }}>
          <form onSubmit={crearCuenta} className="card" style={{ width: 'min(440px, calc(100vw - 2rem))', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div>
                <h3>Crear cuenta</h3>
                <p style={{ color: 'var(--text-muted)' }}>{trabajadorNombre(cuentaTrabajador)} · rol TRABAJADOR</p>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setCuentaTrabajador(null)} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input-field"
                type="email"
                value={cuentaForm.email}
                onChange={e => setCuentaForm({ ...cuentaForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input-field"
                value={cuentaForm.password}
                onChange={e => setCuentaForm({ ...cuentaForm, password: e.target.value })}
                required
                minLength={4}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              <KeyRound size={16} /> {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default TrabajadoresPage;
