import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@core/AuthContext';
import { Bot, Calendar, PackageCheck, RefreshCw, Sparkles } from 'lucide-react';

interface DetalleCompra {
  insumo_id: number;
  insumo: { nombre: string; unidad_medida: string };
  cantidad: number;
}

interface LoteIngreso {
  insumo_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad: number;
  fecha_vencimiento: string;
  tiene_fecha_impresa: boolean;
  fuente_sugerencia?: string;
  vida_util_sugerida_dias?: number;
  sugerencia_mensaje?: string;
  sugerencia_explicacion?: string;
  agente_estado?: string;
  agente_mensaje?: string;
  accion_sugerida?: string;
  ambiente_estimado?: string;
  loading_sugerencia?: boolean;
}

interface VidaUtilResponse {
  fecha_vencimiento_sugerida?: string;
  vida_util_sugerida_dias?: number;
  fuente: string;
  requiere_revision: boolean;
  razon_corta?: string;
  explicacion?: string;
  accion_sugerida?: string;
  agente?: {
    nombre: string;
    estado: string;
    mensaje: string;
  };
  cuidados?: string[];
  ambiente_estimado?: string;
  mensaje?: string;
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
            unidad_medida: d.insumo.unidad_medida,
            cantidad: d.cantidad, // Por defecto asumimos que llega todo lo comprado
            fecha_vencimiento: '',
            tiene_fecha_impresa: false
          }));
          setLotes(initialLotes);
          sugerirLotesIniciales(initialLotes);
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

  const sugerirVidaUtil = async (lote: LoteIngreso): Promise<Partial<LoteIngreso>> => {
    const fechaRecepcion = new Date().toISOString().slice(0, 10);
    const params = new URLSearchParams({
      insumo_id: String(lote.insumo_id),
      fecha_recepcion: fechaRecepcion
    });

    const res = await fetch(`/api/vida-util/sugerir?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data: VidaUtilResponse = await res.json();
    if (!res.ok) throw new Error((data as any).error || 'No se pudo sugerir vida útil');

    return {
      fecha_vencimiento: data.fecha_vencimiento_sugerida || lote.fecha_vencimiento,
      fuente_sugerencia: data.fuente,
      vida_util_sugerida_dias: data.vida_util_sugerida_dias,
      sugerencia_mensaje: data.requiere_revision
        ? data.mensaje || 'Ingrese fecha manual'
        : `${data.vida_util_sugerida_dias} días sugeridos`,
      sugerencia_explicacion: data.razon_corta || data.explicacion,
      agente_estado: data.agente?.estado || (data.fuente === 'gemini' ? 'Agente IA activo' : 'Estimación automática'),
      agente_mensaje: data.agente?.mensaje,
      accion_sugerida: data.accion_sugerida,
      ambiente_estimado: data.ambiente_estimado
    };
  };

  const sugerirLotesIniciales = async (items: LoteIngreso[]) => {
    setLotes(items.map(lote => ({
      ...lote,
      loading_sugerencia: !lote.tiene_fecha_impresa,
      sugerencia_mensaje: lote.tiene_fecha_impresa ? lote.sugerencia_mensaje : 'Calculando sugerencia...'
    })));
    const sugeridos = await Promise.all(items.map(async (lote) => {
      try {
        return { ...lote, ...(await sugerirVidaUtil(lote)), loading_sugerencia: false };
      } catch {
        return {
          ...lote,
          loading_sugerencia: false,
          sugerencia_mensaje: 'No se pudo sugerir fecha; ingrese manualmente',
          fuente_sugerencia: 'error',
          agente_estado: 'Agente IA sin respuesta'
        };
      }
    }));
    setLotes(sugeridos);
  };

  const solicitarSugerencia = async (index: number, loteOverride?: LoteIngreso) => {
    const lote = loteOverride || lotes[index];
    if (!lote || lote.tiene_fecha_impresa) return;

    const loadingLotes = [...lotes];
    loadingLotes[index] = { ...lote, loading_sugerencia: true, sugerencia_mensaje: 'Calculando sugerencia...' };
    setLotes(loadingLotes);

    try {
      const sugerencia = await sugerirVidaUtil(lote);
      const newLotes = [...loadingLotes];
      newLotes[index] = { ...lote, ...sugerencia, loading_sugerencia: false };
      setLotes(newLotes);
    } catch {
      const newLotes = [...loadingLotes];
      newLotes[index] = {
        ...lote,
        loading_sugerencia: false,
        sugerencia_mensaje: 'No se pudo sugerir fecha; ingrese manualmente',
        fuente_sugerencia: 'error',
        agente_estado: 'Agente IA sin respuesta'
      };
      setLotes(newLotes);
    }
  };

  const cambiarFechaImpresa = (index: number, checked: boolean) => {
    const newLotes = [...lotes];
    const updated = {
      ...newLotes[index],
      tiene_fecha_impresa: checked,
      fuente_sugerencia: checked ? undefined : newLotes[index].fuente_sugerencia,
      vida_util_sugerida_dias: checked ? undefined : newLotes[index].vida_util_sugerida_dias,
      sugerencia_mensaje: checked ? 'Fecha impresa: no se reemplaza automáticamente' : newLotes[index].sugerencia_mensaje
    };
    newLotes[index] = updated;
    setLotes(newLotes);
    if (!checked) solicitarSugerencia(index, updated);
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
          lotes: lotes.map((lote, index) => ({
            ...lote,
            lote_code: `AUTO-${compraId}-${lote.insumo_id}-${index + 1}`
          }))
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
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {lotes.map((lote, idx) => (
                <section key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.15rem', background: 'var(--input-bg)', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0, marginBottom: '0.25rem' }}>Insumo recibido</p>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{lote.nombre}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Unidad: {lote.unidad_medida}</p>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', fontSize: '1rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 0.9rem', background: '#fff' }}>
                      <input
                        type="checkbox"
                        checked={lote.tiene_fecha_impresa}
                        onChange={e => cambiarFechaImpresa(idx, e.target.checked)}
                      />
                      Tiene fecha impresa
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cant. recibida</label>
                      <input
                        type="number"
                        className="input-field"
                        value={lote.cantidad}
                        onChange={e => updateLote(idx, 'cantidad', Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Vencimiento</label>
                      <input
                        type="date"
                        className="input-field"
                        value={lote.fecha_vencimiento}
                        onChange={e => updateLote(idx, 'fecha_vencimiento', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderRadius: '8px', padding: '1rem', background: lote.tiene_fecha_impresa ? '#f8fafc' : 'linear-gradient(135deg, #eff6ff, #f7fee7)', border: '1px solid #dbeafe', display: 'grid', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div className={lote.loading_sugerencia ? 'ai-robot-icon is-thinking' : 'ai-robot-icon'}>
                          <Bot size={22} />
                          {lote.loading_sugerencia && (
                            <>
                              <span className="ai-gear ai-gear-one" />
                              <span className="ai-gear ai-gear-two" />
                            </>
                          )}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem', display: 'block' }}>
                            Recomendación de vencimiento para {lote.nombre}
                          </strong>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                            {lote.loading_sugerencia
                              ? 'El agente está leyendo el insumo y calculando una fecha editable.'
                              : 'El agente infiere el ambiente por la fecha y deja la fecha editable.'}
                          </p>
                        </div>
                      </div>
                      {!lote.tiene_fecha_impresa && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => solicitarSugerencia(idx)}
                          disabled={lote.loading_sugerencia}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 0.85rem' }}
                        >
                          <RefreshCw size={16} /> {lote.loading_sugerencia ? 'Analizando...' : 'Recalcular'}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', alignItems: 'stretch' }}>
                      <div style={{ borderRadius: '8px', padding: '0.9rem', background: '#fff', border: '1px solid #dbeafe' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: lote.tiene_fecha_impresa ? 'var(--text-muted)' : 'var(--success-color)', fontWeight: 800, fontSize: '1.15rem' }}>
                          <Calendar size={19} />
                          {lote.loading_sugerencia ? 'Analizando insumo...' : lote.sugerencia_mensaje || 'Sugerencia pendiente'}
                        </span>
                        {lote.ambiente_estimado && !lote.tiene_fecha_impresa && (
                          <span style={{ display: 'block', marginTop: '0.45rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Ambiente: {lote.ambiente_estimado}
                          </span>
                        )}
                      </div>

                      <div style={{ borderRadius: '8px', padding: '0.9rem', background: '#fff', border: '1px solid #dbeafe', display: 'grid', gap: '0.45rem' }}>
                        {lote.tiene_fecha_impresa ? (
                          <strong style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                            Usa la fecha impresa del proveedor. El agente no la reemplaza.
                          </strong>
                        ) : (
                          <>
                            <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: '0.35rem', borderRadius: '999px', padding: '0.35rem 0.65rem', background: lote.fuente_sugerencia === 'gemini' ? '#dcfce7' : '#e0f2fe', color: lote.fuente_sugerencia === 'gemini' ? '#166534' : '#075985', fontWeight: 800, fontSize: '0.9rem' }}>
                              <Sparkles size={15} />
                              {lote.agente_estado || 'Agente IA'}
                            </span>
                            {lote.sugerencia_explicacion && (
                              <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                                {lote.sugerencia_explicacion}
                              </strong>
                            )}
                            {lote.accion_sugerida && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                {lote.accion_sugerida}
                              </span>
                            )}
                            {lote.agente_mensaje && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {lote.agente_mensaje}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

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
