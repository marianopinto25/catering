import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  ClipboardList,
  Truck, 
  LogOut,
  ShoppingBag,
  Package,
  AlertCircle,
  BookOpenText,
  Shapes,
  Utensils,
  Menu,
  BadgeCheck,
  Users,
  FileCheck2,
  ChefHat
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <ClipboardList size={20} />, label: 'Manejo Inv. y Compras' },
    { to: '/proveedores', icon: <Truck size={20} />, label: 'Proveedores' },
    { to: '/insumos', icon: <Shapes size={20} />, label: 'Insumos' },
    { to: '/compras', icon: <ShoppingBag size={20} />, label: 'Compras' },
    { to: '/inventario', icon: <Package size={20} />, label: 'Inventario' },
    { to: '/alertas', icon: <AlertCircle size={20} />, label: 'Alertas' },
    { to: '/menu', icon: <Utensils size={20} />, label: 'Menú' },
    { to: '/menu/recetas', icon: <BookOpenText size={20} />, label: 'Recetas' },
    { to: '/produccion', icon: <ChefHat size={20} />, label: 'Producción' },
    { to: '/comedor/consumo', icon: <BadgeCheck size={20} />, label: 'Consumo' },
    ...(user?.rol === 'Gerente' ? [{ to: '/comedor/trabajadores', icon: <Users size={20} />, label: 'Trabajadores' }] : []),
    { to: '/reportes/diario', icon: <FileCheck2 size={20} />, label: 'Reporte diario' },
  ];

  return (
    <aside style={{
      width: collapsed ? '76px' : '260px',
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
      zIndex: 100,
      transition: 'width 0.2s ease'
    }}>
      <div style={{ padding: collapsed ? '1.25rem 0.75rem' : '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'grid', gap: '0.9rem' }}>
        <button
          type="button"
          aria-label={collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
          title={collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
          onClick={onToggle}
          style={{
            width: collapsed ? '44px' : '100%',
            height: '40px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '0.6rem',
            padding: collapsed ? 0 : '0 0.75rem',
            cursor: 'pointer'
          }}
        >
          <Menu size={20} />
          {!collapsed && <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Ocultar menú</span>}
        </button>

        {!collapsed && (
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: 0, color: 'var(--primary-color)' }}>
              El Junte
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginTop: '0.25rem' }}>
              Catering Empresarial
            </p>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: collapsed ? '1rem 0.5rem' : '1.5rem 0.75rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : '0.75rem',
              padding: collapsed ? '0.875rem 0' : '0.875rem 1rem',
              color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
              textDecoration: 'none',
              borderRadius: '10px',
              marginBottom: '0.25rem',
              background: isActive ? 'var(--soft-bg)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s ease'
            })}
          >
            {item.icon}
            {!collapsed && <span style={{ fontSize: '0.9rem' }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: collapsed ? '1rem 0.75rem' : '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-color)', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
            {user?.nombre.charAt(0)}
          </div>
          {!collapsed && <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombre}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{user?.rol}</p>
          </div>}
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn-secondary"
          title={collapsed ? 'Cerrar sesión' : undefined}
          style={{ width: '100%', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: collapsed ? 0 : '0.5rem', border: '1px solid var(--border-color)', color: 'var(--danger-color)', padding: collapsed ? '0.75rem 0' : undefined }}
        >
          <LogOut size={16} /> {!collapsed && <span style={{ fontSize: '0.85rem' }}>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
