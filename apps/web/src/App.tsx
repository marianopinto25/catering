import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../core/web/AuthContext';
import Sidebar from '../../../core/web/Sidebar';
import { publicRoutes, protectedRoutes } from '../../../core/web/modules';

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
      {/* Rutas públicas */}
      {publicRoutes.map((r) => (
        <Route key={r.path as string} path={r.path as string} element={r.element} />
      ))}

      {/* Rutas protegidas */}
      {protectedRoutes.map((r) => (
        <Route
          key={r.path as string}
          path={r.path as string}
          element={<ProtectedRoute>{r.element}</ProtectedRoute>}
        />
      ))}

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
  constructor(props: { children: React.ReactNode }) {
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
