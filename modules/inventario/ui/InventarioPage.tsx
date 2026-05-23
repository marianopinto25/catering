import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@core/AuthContext';
import { Package, Ban, History, ChevronDown, CalendarDays, ShoppingBag, Tag, Truck } from 'lucide-react';

interface InventarioLote {
  id: number;
  fecha_vencimiento: string;
  cantidad_actual: number;
  compra_id?: number | null;
  fecha_compra?: string | null;
  proveedor_nombre?: string;
}

interface ResumenInventario {
  insumo_id: number;
  nombre: string;
  marca?: string;
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

  const formatCantidad = (value: number, unidad: string) => {
    if (unidad.toLowerCase() === 'unidad') return String(Math.round(value));
    return value.toLocaleString('es-BO', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  };

  const formatFecha = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStockTone = (insumo: ResumenInventario) => {
    if (insumo.onHand <= 0) return { label: 'Sin stock', className: 'is-danger' };
    if (insumo.onHand <= insumo.stock_minimo) return { label: 'Bajo mínimo', className: 'is-warning' };
    return { label: 'Disponible', className: 'is-ok' };
  };

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
      <header className="inventory-header">
        <div>
          <h2>
            <Package size={30} /> Control de Inventario
          </h2>
          <p>Existencia real, compras en camino y lotes disponibles para cocina.</p>
        </div>
        <div className="inventory-header-badge">
          <span>{inventario.length}</span>
          <small>insumos activos</small>
        </div>
      </header>

      <div className="inventory-list">
        {inventario.length === 0 ? (
          <div className="card inventory-empty">No hay insumos registrados.</div>
        ) : (
          inventario.map(insumo => {
            const isOpen = expandedRow === insumo.insumo_id;
            const tone = getStockTone(insumo);
            return (
              <motion.article
                key={insumo.insumo_id}
                className={isOpen ? 'inventory-card is-open' : 'inventory-card'}
                layout
              >
                <button
                  type="button"
                  className="inventory-card-main"
                  onClick={() => setExpandedRow(isOpen ? null : insumo.insumo_id)}
                >
                  <span className="inventory-expand-icon">
                    <ChevronDown size={18} />
                  </span>
                  <span className="inventory-name-block">
                    <strong>{insumo.nombre}</strong>
                    <small>{insumo.marca || 'Marca no registrada'} · {insumo.categoria}</small>
                  </span>
                  <span className={`inventory-status ${tone.className}`}>{tone.label}</span>
                  <span className="inventory-metric">
                    <small>Existencia</small>
                    <strong>{formatCantidad(insumo.onHand, insumo.unidad_medida)}</strong>
                  </span>
                  <span className="inventory-metric">
                    <small>En orden</small>
                    <strong>{formatCantidad(insumo.onOrder, insumo.unidad_medida)}</strong>
                  </span>
                  <span className="inventory-metric">
                    <small>Solicitado</small>
                    <strong>{formatCantidad(insumo.requested, insumo.unidad_medida)}</strong>
                  </span>
                  <span className="inventory-unit">{insumo.unidad_medida}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="inventory-lot-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="inventory-lot-panel-inner">
                        <div className="inventory-lot-heading">
                          <div>
                            <strong>Detalle por compras recibidas</strong>
                            <span>Cada tarjeta representa una entrada separada al inventario.</span>
                          </div>
                          <span>{insumo.inventarios.length} registros</span>
                        </div>

                        {insumo.inventarios.length === 0 ? (
                          <div className="inventory-empty-lots">No hay lotes disponibles para este insumo.</div>
                        ) : (
                          <div className="inventory-lot-grid">
                            {insumo.inventarios.map(lote => (
                              <article className="inventory-lot-card" key={lote.id}>
                                <div className="inventory-lot-title">
                                  <strong>{formatCantidad(lote.cantidad_actual, insumo.unidad_medida)} {insumo.unidad_medida}</strong>
                                  <span>{lote.compra_id ? `Compra #${lote.compra_id}` : 'Ingreso manual'}</span>
                                </div>

                                <div className="inventory-lot-facts">
                                  <span><Tag size={15} /> {insumo.marca || 'Marca no registrada'}</span>
                                  <span><Truck size={15} /> {lote.proveedor_nombre || 'Proveedor no identificado'}</span>
                                  <span><ShoppingBag size={15} /> Compra: {formatFecha(lote.fecha_compra)}</span>
                                  <span><CalendarDays size={15} /> Vence: {formatFecha(lote.fecha_vencimiento)}</span>
                                </div>

                                <div className="inventory-lot-actions">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); registrarAjuste(lote.id, 'Vencido'); }}
                                    className="btn-secondary"
                                  >
                                    <History size={14} /> Vencido
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); registrarAjuste(lote.id, 'Dañado'); }}
                                    className="btn-danger"
                                  >
                                    <Ban size={14} /> Dañado
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default InventarioPage;
