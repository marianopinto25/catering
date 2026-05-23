import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from '../../../core/web/AuthContext';
import Sidebar from '../../../core/web/Sidebar';
import ThemeToggle from '../../../core/web/ThemeToggle';
import { publicRoutes, protectedRoutes } from '../../../core/web/modules';

const RouteChangeLoader: React.FC = () => {
  const location = useLocation();
  const firstRender = React.useRef(true);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 520);
    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <motion.div
            className="route-loader-card"
            initial={{ y: 12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="route-loader-mark">
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong>El Junte</strong>
              <p>Cargando pantalla...</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
      <main style={{
        marginLeft: `${sidebarWidth}px`,
        padding: '2.5rem',
        width: `calc(100% - ${sidebarWidth}px)`,
        minHeight: '100vh',
        background: 'var(--bg-color)',
        transition: 'margin-left 0.2s ease, width 0.2s ease'
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
          <ThemeToggle />
          <RouteChangeLoader />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
