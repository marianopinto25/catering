import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { Package, Ban, History, ChevronDown, ChevronUp } from 'lucide-react';

interface InventarioLote {
  id: number;
  lote: string;
  fecha_vencimiento: string;
  cantidad_actual: number;
}

interface ResumenInventario {
  insumo_id: number;
  nombre: string;
  unidad_medida: string;
  categoria: string;
  stock_minimo: number;
  onHand: number;
  onOrder: number;
  requested: number;
  inventarios: InventarioLote[];
}

const InventarioPage: React.FC = () => {
  const [inventario, setInventario] = useState<ResumenInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { token } = useAuth();

  const fetchInventario = async () => {
    try {
      const [resumenRes, lotesRes] = await Promise.all([
        fetch('/api/inventario/resumen', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/inventario', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (resumenRes.ok && lotesRes.ok) {
        const resumen = await resumenRes.json();
        const lotes = await lotesRes.json();
        const lotesPorInsumo = new Map<number, InventarioLote[]>(
          lotes.map((item: any) => [item.id, item.inventarios])
        );

        setInventario(resumen.map((item: ResumenInventario) => ({
          ...item,
          inventarios: lotesPorInsumo.get(item.insumo_id) || []
        })));
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

  const registrarAjuste = async (loteId: number, tipo: 'Vencido' | 'Dañado') => {
    const cantidad = window.prompt(`Cantidad para ajuste por ${tipo}:`, '0');
    if (!cantidad || isNaN(Number(cantidad)) || Number(cantidad) <= 0) return;

    const motivo = window.prompt('Detalle del ajuste (opcional):', tipo);

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
        alert('Ajuste de inventario registrado.');
        fetchInventario();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al registrar ajuste');
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
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Existencia, compras en orden y solicitudes internas de cocina.
        </p>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Existencia</th>
              <th>En orden</th>
              <th>Solicitado</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {inventario.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay insumos registrados.</td></tr>
            ) : (
              inventario.map(insumo => (
                <React.Fragment key={insumo.insumo_id}>
                  <tr
                    style={{
                      cursor: 'pointer',
                      background: expandedRow === insumo.insumo_id ? '#f8fafc' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                    onClick={() => setExpandedRow(expandedRow === insumo.insumo_id ? null : insumo.insumo_id)}
                  >
                    <td style={{ textAlign: 'center' }}>
                      {expandedRow === insumo.insumo_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                    <td><strong style={{ fontWeight: 600 }}>{insumo.nombre}</strong></td>
                    <td><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{insumo.categoria}</span></td>
                    <td style={{ fontWeight: 700 }}>{insumo.onHand.toFixed(2)}</td>
                    <td>{insumo.onOrder.toFixed(2)}</td>
                    <td>{insumo.requested.toFixed(2)}</td>
                    <td>{insumo.unidad_medida}</td>
                  </tr>

                  <AnimatePresence>
                    {expandedRow === insumo.insumo_id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={7} style={{ padding: '0 1.5rem 1.5rem 3.5rem', background: '#fcfcfc' }}>
                          <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Desglose por Lotes</p>
                            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cód. Lote</th>
                                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Vencimiento</th>
                                  <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cant.</th>
                                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Ajustes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {insumo.inventarios.map(lote => (
                                  <tr key={lote.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '0.75rem 0.5rem' }}><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{lote.lote || 'S/L'}</code></td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                      {lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{lote.cantidad_actual}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); registrarAjuste(lote.id, 'Vencido'); }}
                                        className="btn-secondary"
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                      >
                                        <History size={14} /> Vencido
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); registrarAjuste(lote.id, 'Dañado'); }}
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
