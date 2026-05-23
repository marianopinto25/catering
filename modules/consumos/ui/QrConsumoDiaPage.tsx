import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, MonitorSmartphone } from 'lucide-react';
import QRCode from 'react-qr-code';

const today = () => new Date().toISOString().slice(0, 10);
const turnos = ['Desayuno', 'Almuerzo', 'Cena'];

const QrConsumoDiaPage: React.FC = () => {
  const [fecha] = useState(today());
  const [turno, setTurno] = useState('Almuerzo');

  const consumoUrl = useMemo(() => {
    const params = new URLSearchParams({ fecha, turno });
    return `${window.location.origin}/mi-consumo?${params.toString()}`;
  }, [fecha, turno]);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '1.5rem', maxWidth: '980px' }}>
      <div>
        <h2>QR del día</h2>
        <p style={{ color: 'var(--text-muted)' }}>Muestra este código para que el trabajador lo escanee y registre su consumo del turno.</p>
      </div>

      <section className="card" style={{ display: 'grid', gridTemplateColumns: '180px 220px 1fr', gap: '0.9rem', alignItems: 'end' }}>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="input-field" value={fecha} disabled />
        </div>
        <div className="form-group">
          <label className="form-label">Turno</label>
          <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)}>
            {turnos.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => navigator.clipboard?.writeText(consumoUrl)}>
            <Copy size={16} /> Copiar enlace
          </button>
        </div>
      </section>

      <section className="card" style={{ display: 'grid', justifyItems: 'center', gap: '1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>
          <MonitorSmartphone size={20} /> {fecha} · {turno}
        </div>
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <QRCode value={consumoUrl} size={320} />
        </div>
        <code style={{ maxWidth: '100%', padding: '0.85rem', borderRadius: '8px', background: 'var(--soft-bg)', wordBreak: 'break-all', textAlign: 'left' }}>
          {consumoUrl}
        </code>
      </section>
    </motion.div>
  );
};

export default QrConsumoDiaPage;
