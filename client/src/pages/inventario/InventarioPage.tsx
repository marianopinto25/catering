import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Package, Ban, History, ChevronDown, ChevronUp } from 'lucide-react';

interface InventarioLote {
  id: number;
  lote: string;
  fecha_vencimiento: string;
  cantidad_actual: number;
  estado: string;
}

interface InsumoInventario {
  id: number;
  nombre: string;
  unidad_medida: string;
  categoria: string;
  stock_total: number;
  inventarios: InventarioLote[];
}

const InventarioPage: React.FC = () => {
  const [inventario, setInventario] = useState<InsumoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { token } = useAuth();

  const fetchInventario = async () => {
    try {
      const res = await fetch('/api/inventario', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInventario(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventario();
  }, []);

  const handleMerma = async (loteId: number, tipo: 'Vencido' | 'Dañado') => {
    const cantidad = window.prompt(`Cantidad a retirar como ${tipo}:`, '0');
    if (!cantidad || isNaN(Number(cantidad)) || Number(cantidad) <= 0) return;

    const motivo = window.prompt('Motivo detallado (opcional):', `Reportado como ${tipo}`);

    try {
      const res = await fetch('/api/inventario/merma', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          inventario_id: loteId, 
          cantidad: Number(cantidad), 
          motivo: motivo || tipo 
        }),
      });

      if (res.ok) {
        alert('Merma registrada con éxito.');
        fetchInventario();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al registrar merma');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Consultando almacén...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Package size={28} /> Control de Inventario
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Consulta de existencias y gestión de lotes El Junte</p>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Stock Total</th>
              <th>Unidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {inventario.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay existencias registradas.</td></tr>
            ) : (
              inventario.map(insumo => (
                <React.Fragment key={insumo.id}>
                  <tr 
                    style={{ 
                      cursor: 'pointer', 
                      background: expandedRow === insumo.id ? '#f8fafc' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                    onClick={() => setExpandedRow(expandedRow === insumo.id ? null : insumo.id)}
                  >
                    <td style={{ textAlign: 'center' }}>
                      {expandedRow === insumo.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                    <td><strong style={{ fontWeight: 600 }}>{insumo.nombre}</strong></td>
                    <td><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{insumo.categoria}</span></td>
                    <td style={{ fontWeight: 700 }}>{insumo.stock_total.toFixed(2)}</td>
                    <td>{insumo.unidad_medida}</td>
                    <td>
                      {insumo.stock_total > 0 ? (
                        <span style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 700, background: '#f0fdf4', padding: '0.25rem 0.6rem', borderRadius: '12px' }}>DISPONIBLE</span>
                      ) : (
                        <span style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 700, background: '#fef2f2', padding: '0.25rem 0.6rem', borderRadius: '12px' }}>SIN STOCK</span>
                      )}
                    </td>
                  </tr>
                  
                  <AnimatePresence>
                    {expandedRow === insumo.id && (
                      <motion.tr 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={6} style={{ padding: '0 1.5rem 1.5rem 3.5rem', background: '#fcfcfc' }}>
                          <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Desglose por Lotes</p>
                            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cód. Lote</th>
                                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Vencimiento</th>
                                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cant.</th>
                                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {insumo.inventarios.map(lote => (
                                  <tr key={lote.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '0.75rem 0.5rem' }}><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{lote.lote || 'S/L'}</code></td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                      {lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{lote.cantidad_actual}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleMerma(lote.id, 'Vencido'); }}
                                        className="btn-secondary" 
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                      >
                                        <History size={14} /> Vencido
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleMerma(lote.id, 'Dañado'); }}
                                        className="btn-danger" 
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                      >
                                        <Ban size={14} /> Dañado
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {insumo.inventarios.length === 0 && (
                                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay lotes disponibles para este insumo.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default InventarioPage;
