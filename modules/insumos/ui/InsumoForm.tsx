import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Save } from 'lucide-react';

const InsumoForm: React.FC = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stockMinimo, setStockMinimo] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchInsumo = async () => {
        try {
          const res = await fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } });
          const all = await res.json();
          const target = all.find((i: any) => i.id === Number(id));
          if (target) {
            setNombre(target.nombre);
            setUnidad(target.unidad_medida);
            setCategoria(target.categoria);
            setStockMinimo(target.stock_minimo);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchInsumo();
    }
  }, [id, isEditing, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stockMinimo < 0) return setError('El stock mínimo no puede ser negativo');
    
    setLoading(true);
    setError('');

    const url = isEditing ? `/api/insumos/${id}` : '/api/insumos';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          nombre, 
          unidad_medida: unidad, 
          categoria, 
          stock_minimo: stockMinimo 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al guardar');

      navigate('/insumos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{isEditing ? 'Editar Insumo' : 'Nuevo Insumo al Catálogo'}</h2>
        <Link to="/insumos" className="btn-secondary">Volver</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Insumo</label>
            <input 
              type="text" 
              className="input-field" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unidad de Medida</label>
              <select className="input-field" value={unidad} onChange={e => setUnidad(e.target.value)} required>
                <option value="">Seleccione...</option>
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="L">Litros (L)</option>
                <option value="Unidad">Unidades</option>
                <option value="Paquete">Paquetes</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ej: Carnes, Abarrotes"
                value={categoria} 
                onChange={e => setCategoria(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Stock Mínimo (Alerta)</label>
            <input 
              type="number" 
              className="input-field" 
              value={stockMinimo} 
              onChange={e => setStockMinimo(Number(e.target.value))} 
              min="0"
              required 
            />
          </div>

          {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Información'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default InsumoForm;
