import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PackageOpen, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumenAlertas {
  totalBajoStock: number;
  totalVencimiento: number;
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [alertas, setAlertas] = useState<ResumenAlertas>({ totalBajoStock: 0, totalVencimiento: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const res = await fetch('/api/alertas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAlertas(data.resumen);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchResumen();
  }, [token]);

  const cards = [
    { 
      title: 'Stock Bajo Mínimo', 
      value: alertas.totalBajoStock, 
      icon: <PackageOpen size={24} color={alertas.totalBajoStock > 0 ? "#ef4444" : "#000"} />, 
      desc: 'Insumos que requieren compra',
      action: () => navigate('/alertas')
    },
    { 
      title: 'Alertas Vencimiento', 
      value: alertas.totalVencimiento, 
      icon: <AlertTriangle size={24} color={alertas.totalVencimiento > 0 ? "#ef4444" : "#000"} />, 
      desc: 'Lotes próximos a caducar',
      action: () => navigate('/alertas')
    },
    { 
      title: 'Compras Pendientes', 
      value: '-', 
      icon: <TrendingUp size={24} color="#000" />, 
      desc: 'Facturas por recibir',
      action: () => navigate('/compras')
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Panel de Control</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Bienvenido de nuevo, {user?.nombre}. Gestión de El Junte.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {cards.map((card, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -4 }}
            onClick={card.action}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', padding: '1.75rem' }}
          >
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{card.title}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{card.value}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
