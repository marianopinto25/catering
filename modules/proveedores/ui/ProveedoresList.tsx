import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@core/AuthContext';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Proveedor {
  id: number;
  nit_rut: string;
  razon_social: string;
  telefono: string;
  responsable_nombre: string;
  responsable_cargo: string;
  responsable_telefono: string;
  responsable_email: string;
}

const ProveedoresList: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProveedores(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿ELIMINAR PROVEEDOR? El proveedor no aparecerá en los listados por defecto.')) return;
    try {
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProveedores(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Directorio de Proveedores</h2>
        <Link to="/proveedores/nuevo" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nuevo Proveedor
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>NIT / RUT</th>
              <th>Razón Social</th>
              <th>Responsable</th>
              <th>Contacto</th>
              <th style={{ width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No hay proveedores registrados.</td></tr>
            ) : (
              proveedores.map(p => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td>{p.nit_rut}</td>
                  <td>{p.razon_social}</td>
                  <td>
                    <strong>{p.responsable_nombre || '-'}</strong><br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.responsable_cargo || '-'}</span>
                  </td>
                  <td>
                    {p.responsable_telefono || p.telefono || '-'}<br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.responsable_email || '-'}</span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/proveedores/${p.id}/editar`} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                      <Pencil size={16} />
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ProveedoresList;
