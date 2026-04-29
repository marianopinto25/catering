import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { Plus, PackageCheck, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatMoney } from '@core/format';

interface Compra {
  id: number;
  proveedor: { razon_social: string };
  fecha: string;
  total: number;
  estado: 'PENDIENTE_INGRESO' | 'INGRESADA';
}

const ComprasPage: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchCompras = async () => {
    try {
      const res = await fetch('/api/compras', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCompras(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Gestión de Compras</h2>
          <p style={{ color: 'var(--text-muted)' }}>Registro de abastecimiento El Junte</p>
        </div>
        <Link to="/compras/nueva" className="btn-primary" style={{ gap: '0.5rem' }}>
          <Plus size={18} /> Nueva Compra
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Total</th>
              <th>Estado</th>
              <th style={{ width: '150px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {compras.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay compras registradas.</td></tr>
              ) : (
                compras.map(c => (
                  <motion.tr 
                    key={c.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td><span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{c.id}</span></td>
                    <td>{new Date(c.fecha).toLocaleDateString()}</td>
                    <td>{c.proveedor?.razon_social}</td>
                    <td style={{ fontWeight: 600 }}>{formatMoney(c.total)}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: c.estado === 'INGRESADA' ? '#f0fdf4' : '#fff7ed',
                        color: c.estado === 'INGRESADA' ? '#166534' : '#9a3412',
                        border: `1px solid ${c.estado === 'INGRESADA' ? '#dcfce7' : '#ffedd5'}`
                      }}>
                        {c.estado === 'PENDIENTE_INGRESO' ? 'Pendiente' : 'Ingresada'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.6rem' }}>
                      {c.estado === 'PENDIENTE_INGRESO' && (
                        <button 
                          onClick={() => navigate(`/inventario/ingreso?compra=${c.id}`)}
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', background: '#000', borderRadius: '8px' }}
                          title="Recibir Mercancía"
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}
                      <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ComprasPage;
