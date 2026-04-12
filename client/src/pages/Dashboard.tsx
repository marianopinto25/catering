import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PackageOpen, Users, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const cards = [
    { title: 'Proveedores Activos', value: '4', icon: <Users size={24} color="#000" />, desc: 'Registrados en el sistema' },
    { title: 'Alertas Inventario', value: '0', icon: <AlertTriangle size={24} color="#E53935" />, desc: 'Insumos bajo stock o vencidos' },
    { title: 'Menú Programado', value: 'Listo', icon: <PackageOpen size={24} color="#000" />, desc: 'Para el día de hoy' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Dashboard Administrativo</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
        Bienvenido al sistema, {user?.nombre || 'General'}.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {cards.map((card, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -5 }}
            className="card"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
          >
            <div style={{ background: '#F0F0F0', padding: '1rem', borderRadius: '50%' }}>
              {card.icon}
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: '0.25rem' }}>{card.title}</p>
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{card.value}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
