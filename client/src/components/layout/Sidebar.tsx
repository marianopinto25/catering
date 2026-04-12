import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  LogOut,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/proveedores', icon: <Truck size={20} />, label: 'Proveedores' },
  ];

  return (
    <div style={{ 
      width: '260px', 
      height: '100vh', 
      background: 'var(--surface-color)', 
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed'
    }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>CATERING ADMIN</h1>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              marginBottom: '0.5rem',
              color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
              background: isActive ? '#F5F5F5' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s'
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <div style={{ background: '#EEE', padding: '0.5rem', borderRadius: '50%' }}>
            <User size={18} />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.nombre}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.rol}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.75rem 1rem',
            color: 'var(--danger-color)',
            background: 'transparent',
            textAlign: 'left'
          }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
