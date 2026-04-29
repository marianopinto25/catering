import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  LogOut,
  User,
  ShoppingBag,
  Package,
  AlertCircle,
  Shapes
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
    { to: '/insumos', icon: <Shapes size={20} />, label: 'Insumos' },
    { to: '/compras', icon: <ShoppingBag size={20} />, label: 'Compras' },
    { to: '/inventario', icon: <Package size={20} />, label: 'Inventario' },
    { to: '/alertas', icon: <AlertCircle size={20} />, label: 'Alertas' },
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      background: 'var(--sidebar-bg)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      borderRight: '1px solid var(--border-color)',
      boxShadow: '4px 0 10px rgba(0,0,0,0.02)',
      zIndex: 100
    }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#000' }}>
          El Junte
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginTop: '0.25rem' }}>
          Catering Empresarial
        </p>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 0.75rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
              textDecoration: 'none',
              borderRadius: '10px',
              marginBottom: '0.25rem',
              background: isActive ? '#f1f5f9' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s ease'
            })}
          >
            {item.icon}
            <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
            {user?.nombre.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombre}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{user?.rol}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid #fee2e2', color: '#ef4444' }}
        >
          <LogOut size={16} /> <span style={{ fontSize: '0.85rem' }}>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
