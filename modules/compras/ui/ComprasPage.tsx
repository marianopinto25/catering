import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { ChevronDown, ChevronUp, Clock, Eye, PackageCheck, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatMoney } from '@core/format';

interface CompraDetalle {
  id: number;
  cantidad: number;
  precio_unitario: number;
  insumo: {
    nombre: string;
    unidad_medida: string;
  };
}

interface Compra {
  id: number;
  proveedor: { razon_social: string };
  fecha: string;
  total: number;
  estado: 'PENDIENTE_INGRESO' | 'INGRESADA';
  detalles: CompraDetalle[];
}

const ComprasPage: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIngresadas, setShowIngresadas] = useState(false);
  const [expandedCompraId, setExpandedCompraId] = useState<number | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchCompras = async () => {
    try {
      const res = await fetch('/api/compras', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCompras(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const comprasPendientes = compras.filter(c => c.estado === 'PENDIENTE_INGRESO');
  const comprasIngresadas = compras.filter(c => c.estado === 'INGRESADA');
  const comprasVisibles = showIngresadas ? [...comprasPendientes, ...comprasIngresadas] : comprasPendientes;

  const formatFechaHora = (value: string) => {
    const date = new Date(value);
    return {
      fecha: date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getResumenInsumos = (compra: Compra) => {
    if (!compra.detalles?.length) return 'Sin detalle de insumos';
    const principales = compra.detalles
      .slice(0, 2)
      .map(det => `${det.insumo?.nombre || 'Insumo'} ${det.cantidad} ${det.insumo?.unidad_medida || ''}`);
    const extra = compra.detalles.length > 2 ? ` +${compra.detalles.length - 2} mas` : '';
    return `${principales.join(' · ')}${extra}`;
  };

  const renderEstado = (estado: Compra['estado']) => (
    <span style={{
      padding: '0.3rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: 700,
      background: estado === 'INGRESADA' ? '#f0fdf4' : '#fff7ed',
      color: estado === 'INGRESADA' ? '#166534' : '#9a3412',
      border: `1px solid ${estado === 'INGRESADA' ? '#dcfce7' : '#ffedd5'}`
    }}>
      {estado === 'PENDIENTE_INGRESO' ? 'Pendiente' : 'Ingresada'}
    </span>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Gestión de Compras</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pendientes visibles, ingresadas ocultas hasta revisar historial.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowIngresadas(prev => !prev);
              setExpandedCompraId(null);
            }}
            style={{ gap: '0.45rem' }}
          >
            {showIngresadas ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {showIngresadas ? 'Ocultar ingresadas' : `Ver ingresadas (${comprasIngresadas.length})`}
          </button>
          <Link to="/compras/nueva" className="btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={18} /> Nueva Compra
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
        <div className="card" style={{ padding: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Pendientes de ingreso</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.2rem' }}>{comprasPendientes.length}</strong>
        </div>
        <div className="card" style={{ padding: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Ingresadas a bodega</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', marginTop: '0.2rem' }}>{comprasIngresadas.length}</strong>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>Compra</th>
              <th>Fecha y hora</th>
              <th>Proveedor</th>
              <th>Insumos</th>
              <th>Total</th>
              <th>Estado</th>
              <th style={{ width: '150px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando compras...</td></tr>
              ) : comprasVisibles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {showIngresadas ? 'No hay compras registradas.' : 'No hay compras pendientes. Use "Ver ingresadas" para revisar el historial.'}
                  </td>
                </tr>
              ) : (
                comprasVisibles.map(c => {
                  const fecha = formatFechaHora(c.fecha);
                  const expanded = expandedCompraId === c.id;

                  return (
                    <React.Fragment key={c.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setExpandedCompraId(expanded ? null : c.id)}
                        style={{ cursor: 'pointer', background: expanded ? '#f8fafc' : 'transparent' }}
                      >
                        <td>
                          <strong style={{ display: 'block' }}>Compra #{c.id}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.detalles?.length || 0} item(s)</span>
                        </td>
                        <td>
                          <strong style={{ display: 'block' }}>{fecha.fecha}</strong>
                          <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                            <Clock size={14} /> {fecha.hora}
                          </span>
                        </td>
                        <td>{c.proveedor?.razon_social}</td>
                        <td style={{ maxWidth: 360 }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{getResumenInsumos(c)}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatMoney(c.total)}</td>
                        <td>{renderEstado(c.estado)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.6rem' }} onClick={e => e.stopPropagation()}>
                            {c.estado === 'PENDIENTE_INGRESO' && (
                              <button
                                onClick={() => navigate(`/inventario/ingreso?compra=${c.id}`)}
                                className="btn-primary"
                                style={{ padding: '0.45rem 0.6rem', background: '#000', borderRadius: '8px' }}
                                title="Recibir Mercancía"
                              >
                                <PackageCheck size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setExpandedCompraId(expanded ? null : c.id)}
                              style={{ padding: '0.45rem 0.6rem', borderRadius: '8px' }}
                              title="Ver detalle"
                            >
                              {expanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {expanded && (
                        <tr>
                          <td colSpan={7} style={{ background: '#f8fafc', padding: '0.9rem 1.25rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                              <table className="table-container">
                                <thead>
                                  <tr>
                                    <th>Insumo</th>
                                    <th>Cantidad</th>
                                    <th>Precio unit.</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.detalles?.map(det => (
                                    <tr key={det.id}>
                                      <td><strong>{det.insumo?.nombre}</strong></td>
                                      <td>{det.cantidad} {det.insumo?.unidad_medida}</td>
                                      <td>{formatMoney(det.precio_unitario)}</td>
                                      <td style={{ fontWeight: 700 }}>{formatMoney(det.cantidad * det.precio_unitario)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ComprasPage;
