import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProveedoresList from './pages/proveedores/ProveedoresList';
import ProveedorForm from './pages/proveedores/ProveedorForm';
import Sidebar from './components/layout/Sidebar';

// Sprint 2 Pages
import InsumosList from './pages/insumos/InsumosList';
import InsumoForm from './pages/insumos/InsumoForm';
import ComprasPage from './pages/compras/ComprasPage';
import NuevaCompraForm from './pages/compras/NuevaCompraForm';
import InventarioPage from './pages/inventario/InventarioPage';
import IngresoInventarioForm from './pages/inventario/IngresoInventarioForm';
import AlertasPage from './pages/alertas/AlertasPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ 
        marginLeft: '260px', 
        padding: '2.5rem', 
        width: 'calc(100% - 260px)',
        minHeight: '100vh',
        background: 'var(--bg-color)'
      }}>
        {children}
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Proveedores */}
      <Route path="/proveedores" element={
        <ProtectedRoute>
          <ProveedoresList />
        </ProtectedRoute>
      } />
      <Route path="/proveedores/nuevo" element={
        <ProtectedRoute>
          <ProveedorForm />
        </ProtectedRoute>
      } />
      <Route path="/proveedores/:id/editar" element={
        <ProtectedRoute>
          <ProveedorForm />
        </ProtectedRoute>
      } />

      {/* Insumos */}
      <Route path="/insumos" element={
        <ProtectedRoute>
          <InsumosList />
        </ProtectedRoute>
      } />
      <Route path="/insumos/nuevo" element={
        <ProtectedRoute>
          <InsumoForm />
        </ProtectedRoute>
      } />
      <Route path="/insumos/:id/editar" element={
        <ProtectedRoute>
          <InsumoForm />
        </ProtectedRoute>
      } />

      {/* Compras */}
      <Route path="/compras" element={
        <ProtectedRoute>
          <ComprasPage />
        </ProtectedRoute>
      } />
      <Route path="/compras/nueva" element={
        <ProtectedRoute>
          <NuevaCompraForm />
        </ProtectedRoute>
      } />

      <Route path="/inventario" element={
        <ProtectedRoute>
          <InventarioPage />
        </ProtectedRoute>
      } />
      <Route path="/inventario/ingreso" element={
        <ProtectedRoute>
          <IngresoInventarioForm />
        </ProtectedRoute>
      } />

      {/* Alertas */}
      <Route path="/alertas" element={
        <ProtectedRoute>
          <AlertasPage />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>404 - Página no encontrada</h2>
          <Link to="/" style={{ color: 'var(--primary-color)' }}>Volver al inicio</Link>
        </div>
      } />
    </Routes>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Algo salió mal.</h2>
          <button onClick={() => window.location.reload()} className="btn-primary">Recargar página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
