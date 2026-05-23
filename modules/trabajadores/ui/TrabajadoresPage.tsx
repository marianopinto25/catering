import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, UserPlus } from 'lucide-react';
import { useAuth } from '@core/AuthContext';

interface Cliente {
  id: number;
  razon_social: string;
}

interface Trabajador {
  id: number;
  ci: string;
  codigo_qr?: string | null;
  nombres: string;
  apellidos: string;
  estado: string;
  cliente_id: number;
  cliente?: Cliente;
}

const emptyForm = {
  id: 0,
  ci: '',
  codigo_qr: '',
  nombres: '',
  apellidos: '',
  cliente_id: '',
  estado: 'Activo'
};

const TrabajadoresPage: React.FC = () => {
  const { token, user } = useAuth();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadData = async () => {
    const [trabajadoresRes, clientesRes] = await Promise.all([
      fetch('/api/trabajadores', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/trabajadores/clientes', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    if (trabajadoresRes.ok) setTrabajadores(await trabajadoresRes.json());
    if (clientesRes.ok) setClientes(await clientesRes.json());
  };

  useEffect(() => {
    loadData().catch(() => setError('No se pudo cargar el padrón'));
  }, [token]);

  const edit = (trabajador: Trabajador) => {
    setForm({
      id: trabajador.id,
      ci: trabajador.ci,
      codigo_qr: trabajador.codigo_qr || '',
      nombres: trabajador.nombres,
      apellidos: trabajador.apellidos,
      cliente_id: String(trabajador.cliente_id),
      estado: trabajador.estado
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
          codigo_qr: form.codigo_qr,
          nombres: form.nombres,
          apellidos: form.apellidos,
          cliente_id: Number(form.cliente_id),
          estado: form.estado
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

  if (user?.rol !== 'Gerente') {
    return <div className="card"><p className="error-text">Acceso denegado. Se requiere rol de Gerente.</p></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <h2>Trabajadores autorizados</h2>
        <p style={{ color: 'var(--text-muted)' }}>Padrón de comensales para identificación por CI o código QR.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.8fr) minmax(420px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        <section className="card">
          <h3 style={{ marginBottom: '1rem' }}>{form.id ? 'Editar trabajador' : 'Registrar trabajador'}</h3>
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label">CI</label>
              <input className="input-field" value={form.ci} onChange={e => setForm({ ...form, ci: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Código QR</label>
              <input className="input-field" value={form.codigo_qr} onChange={e => setForm({ ...form, codigo_qr: e.target.value })} placeholder="Ej: QR-1234567" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Nombres</label>
                <input className="input-field" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos</label>
                <input className="input-field" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select className="input-field" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
                <option value="">Seleccione...</option>
                {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.razon_social}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="input-field" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            {message && <p style={{ color: 'var(--success-color)', fontWeight: 700 }}>{message}</p>}
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{trabajadores.length} registros</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>CI</th>
                  <th style={{ padding: '0.75rem' }}>Trabajador</th>
                  <th style={{ padding: '0.75rem' }}>QR</th>
                  <th style={{ padding: '0.75rem' }}>Cliente</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map(trabajador => (
                  <tr key={trabajador.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{trabajador.ci}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.nombres} {trabajador.apellidos}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.codigo_qr || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.cliente?.razon_social || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{trabajador.estado}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button type="button" className="btn-secondary" onClick={() => edit(trabajador)}>
                        <UserPlus size={15} /> Editar
                      </button>
                    </td>
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

export default TrabajadoresPage;
