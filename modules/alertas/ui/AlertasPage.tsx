import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { AlertTriangle, Calendar, Package, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertaBajoStock {
  id: number;
  nombre: string;
  stock_minimo: number;
  stock_actual: number;
}

interface AlertaVencimiento {
  id: number;
  lote: string;
  fecha_vencimiento: string;
  cantidad_actual: number;
  insumo: { nombre: string };
}

const AlertasPage: React.FC = () => {
  const [bajoStock, setBajoStock] = useState<AlertaBajoStock[]>([]);
  const [vencimiento, setVencimiento] = useState<AlertaVencimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(7);
  const { token } = useAuth();

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alertas?dias=${dias}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBajoStock(data.bajoStock);
        setVencimiento(data.vencimiento);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, [dias]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="var(--danger-color)" /> Alertas para anticipar cocina
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label className="form-label" style={{ margin: 0 }}>Anticipación de uso (días):</label>
          <input 
            type="number" 
            className="input-field" 
            style={{ width: '80px', marginTop: 0 }} 
            value={dias} 
            onChange={e => setDias(Number(e.target.value))} 
            min="1"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Alertas de Bajo Stock */}
        <section>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} /> Reponer antes de cocinar ({bajoStock.length})
          </h3>
          <div className="card" style={{ padding: 0 }}>
            <table className="table-container">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Mínimo</th>
                  <th>Actual</th>
                </tr>
              </thead>
              <tbody>
                {bajoStock.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Hay existencia suficiente para preparar.</td></tr>
                ) : (
                  bajoStock.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.nombre}</strong></td>
                      <td>{a.stock_minimo}</td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 700 }}>{a.stock_actual.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Alertas de Vencimiento */}
        <section>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} /> Usar primero ({vencimiento.length})
          </h3>
          <div className="card" style={{ padding: 0 }}>
            <table className="table-container">
              <thead>
                <tr>
                  <th>Insumo / Lote</th>
                  <th>Vence</th>
                  <th>Cant.</th>
                </tr>
              </thead>
              <tbody>
                {vencimiento.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No hay lotes que requieran uso anticipado.</td></tr>
                ) : (
                  vencimiento.map(v => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.insumo.nombre}</strong><br />
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>Lote: {v.lote || '-'}</span>
                      </td>
                      <td style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
                        {new Date(v.fecha_vencimiento).toLocaleDateString()}
                      </td>
                      <td>{v.cantidad_actual}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <Link to="/inventario" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', color: 'var(--text-muted)' }}>
          Revisar inventario <ChevronRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
};

export default AlertasPage;
