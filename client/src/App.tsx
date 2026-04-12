import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProveedoresList from './pages/proveedores/ProveedoresList';
import ProveedorForm from './pages/proveedores/ProveedorForm';
import Sidebar from './components/layout/Sidebar';

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

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
