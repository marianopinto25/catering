import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, Save } from 'lucide-react';
import { formatMoney } from '../../utils/format';

interface Proveedor {
  id: number;
  razon_social: string;
}

interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface ItemDetalle {
  insumo_id: number;
  cantidad: number;
  precio_unitario: number;
}

const NuevaCompraForm: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [detalles, setDetalles] = useState<ItemDetalle[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProv, resIns] = await Promise.all([
          fetch('/api/proveedores', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (resProv.ok) setProveedores(await resProv.json());
        if (resIns.ok) setInsumos(await resIns.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [token]);

  const agregarItem = () => {
    setDetalles([...detalles, { insumo_id: 0, cantidad: 1, precio_unitario: 0 }]);
  };

  const removerItem = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarItem = (index: number, field: keyof ItemDetalle, value: number) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const totalCompra = detalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!proveedorId) return setError('Seleccione un proveedor');
    if (detalles.length === 0) return setError('Agregue al menos un insumo');
    if (detalles.some(d => d.insumo_id === 0 || d.cantidad <= 0 || d.precio_unitario < 0)) {
      return setError('Verifique que todos los items tengan insumo y cantidades válidas');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/compras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          proveedor_id: proveedorId, 
          total: totalCompra, 
          detalles 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar la compra');
      }

      navigate('/compras');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Registrar Nueva Compra</h2>
          <p style={{ color: 'var(--text-muted)' }}>Módulo de abastecimiento El Junte</p>
        </div>
        <Link to="/compras" className="btn-secondary">Cancelar</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
            <label className="form-label">Proveedor</label>
            <select 
              className="input-field" 
              value={proveedorId} 
              onChange={e => setProveedorId(Number(e.target.value))}
              required
            >
              <option value="">Seleccione un proveedor...</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
            </select>
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Detalle de Insumos</h3>
            <button type="button" onClick={agregarItem} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }}>
              <Plus size={16} /> Agregar Fila
            </button>
          </div>

          <AnimatePresence>
            {detalles.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}
              >
                <div>
                  <select 
                    className="input-field"
                    value={item.insumo_id}
                    onChange={e => actualizarItem(index, 'insumo_id', Number(e.target.value))}
                  >
                    <option value="0">Seleccione Insumo...</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>)}
                  </select>
                </div>
                <div>
                  <input 
                    type="number" 
                    placeholder="Cant." 
                    className="input-field" 
                    value={item.cantidad} 
                    min="1"
                    onChange={e => actualizarItem(index, 'cantidad', Number(e.target.value))}
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    placeholder="Precio" 
                    className="input-field" 
                    value={item.precio_unitario} 
                    min="0"
                    step="0.01"
                    onChange={e => actualizarItem(index, 'precio_unitario', Number(e.target.value))}
                  />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: 600 }}>
                  {formatMoney(item.cantidad * item.precio_unitario)}
                </div>
                <button type="button" onClick={() => removerItem(index)} style={{ background: 'transparent', color: 'var(--danger-color)', padding: '0.5rem', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {detalles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay items agregados en esta compra.</p>
            </div>
          )}

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #f1f5f9', textAlign: 'right' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Monto Total</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>{formatMoney(totalCompra)}</p>
          </div>

          {error && <p className="error-text" style={{ marginTop: '1rem', textAlign: 'right' }}>{error}</p>}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '2.5rem', height: '50px', fontSize: '1rem' }}
            disabled={loading}
          >
            <Save size={20} style={{ marginRight: '0.5rem' }} /> {loading ? 'Procesando...' : 'Confirmar Registro de Compra'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default NuevaCompraForm;
