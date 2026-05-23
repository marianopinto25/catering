import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { Plus, Pencil, Trash2, Shapes } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMoney } from '@core/format';

interface Insumo {
  id: number;
  nombre: string;
  marca: string;
  unidad_medida: string;
  categoria: string;
  stock_minimo: number;
  precio_unitario: number;
}

const InsumosList: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/insumos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInsumos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿ELIMINAR INSUMO? Se marcará como inactivo.')) return;
    try {
      const res = await fetch(`/api/insumos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInsumos(prev => prev.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Cargando catálogo...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shapes size={24} /> Catálogo Maestro de Insumos
        </h2>
        <Link to="/insumos/nuevo" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nuevo Insumo
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th>Precio unit.</th>
              <th>Stock Mínimo</th>
              <th style={{ width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No existen insumos en el catálogo.</td></tr>
            ) : (
              insumos.map(i => (
                <tr key={i.id}>
                  <td><strong>{i.nombre}</strong></td>
                  <td>{i.marca || 'Genérica'}</td>
                  <td>{i.categoria}</td>
                  <td>{i.unidad_medida}</td>
                  <td>{formatMoney(i.precio_unitario || 0)} / {i.unidad_medida}</td>
                  <td>{i.stock_minimo}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/insumos/${i.id}/editar`} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                      <Pencil size={16} />
                    </Link>
                    <button onClick={() => handleDelete(i.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default InsumosList;
