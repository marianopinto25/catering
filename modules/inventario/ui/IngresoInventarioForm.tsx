import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@core/AuthContext';
import { PackageCheck, Save, Calendar } from 'lucide-react';

interface DetalleCompra {
  insumo_id: number;
  insumo: { nombre: string; unidad_medida: string };
  cantidad: number;
}

interface LoteIngreso {
  insumo_id: number;
  nombre: string;
  cantidad: number;
  fecha_vencimiento: string;
  lote_code: string;
}

const IngresoInventarioForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const compraId = searchParams.get('compra');
  const [lotes, setLotes] = useState<LoteIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!compraId) {
      setError('ID de compra no proporcionado.');
      setLoading(false);
      return;
    }

    const fetchCompra = async () => {
      try {
        const res = await fetch(`/api/compras/${compraId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.estado !== 'PENDIENTE_INGRESO') {
            setError('Esta compra ya ha sido ingresada al inventario.');
            setLoading(false);
            return;
          }
          // Inicializar lotes según el detalle de la compra
          const initialLotes = data.detalles.map((d: DetalleCompra) => ({
            insumo_id: d.insumo_id,
            nombre: d.insumo.nombre,
            cantidad: d.cantidad, // Por defecto asumimos que llega todo lo comprado
            fecha_vencimiento: '',
            lote_code: ''
          }));
          setLotes(initialLotes);
        } else {
          setError('No se pudo cargar la información de la compra.');
        }
      } catch (e) {
        console.error(e);
        setError('Error al comunicar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompra();
  }, [compraId, token, navigate]);

  const updateLote = (index: number, field: keyof LoteIngreso, value: any) => {
    const newLotes = [...lotes];
    newLotes[index] = { ...newLotes[index], [field]: value };
    setLotes(newLotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/inventario/movimientos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          compra_id: Number(compraId), 
          lotes 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar el ingreso');
      }

      navigate('/inventario');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando datos de recepción...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Recepción de Mercancía</h2>
          <p style={{ color: 'var(--text-muted)' }}>Compra #{compraId}</p>
        </div>
        <Link to="/compras" className="btn-secondary">Volver</Link>
      </div>

      <div className="card">
        {error ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="error-text" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{error}</p>
            <Link to="/compras" className="btn-primary">Ver Compras</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Ingrese los detalles de los lotes recibidos. La fecha de vencimiento es obligatoria para el control de alertas.
            </p>

            <table className="table-container" style={{ marginBottom: '2rem' }}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th style={{ width: '120px' }}>Cant. Recibida</th>
                  <th style={{ width: '200px' }}>Código Lote</th>
                  <th style={{ width: '200px' }}>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote, idx) => (
                  <tr key={idx}>
                    <td><strong>{lote.nombre}</strong></td>
                    <td>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={lote.cantidad} 
                        onChange={e => updateLote(idx, 'cantidad', Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Ej: AB-123"
                        value={lote.lote_code}
                        onChange={e => updateLote(idx, 'lote_code', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="date" 
                          className="input-field" 
                          value={lote.fecha_vencimiento}
                          onChange={e => updateLote(idx, 'fecha_vencimiento', e.target.value)}
                          required
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.6rem' }}
              disabled={saving}
            >
              <PackageCheck size={20} /> {saving ? 'Procesando Ingreso...' : 'Finalizar Recepción e Ingresar a Bodega'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default IngresoInventarioForm;
