import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Camera, Check, Clock, Edit3, Plus, RefreshCw, Save, Search, Sparkles, Trash2, Utensils, X } from 'lucide-react';
import { useAuth } from '@core/AuthContext';

interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface RecetaItem {
  id: number;
  insumo_id?: number;
  cantidad_por_porcion: number;
  unidad_medida: string;
  insumo: Insumo;
}

interface Plato {
  id: number;
  nombre: string;
  descripcion?: string | null;
  receta: RecetaItem[];
}

interface RecetaSugeridaItem {
  insumo_id: number;
  cantidad_por_porcion: number;
  unidad_medida: string;
  insumo: Insumo;
}

interface PlatoSuggestion {
  descripcion: string;
  fuente?: string;
  receta: RecetaSugeridaItem[];
}

interface RecetaPasos {
  titulo: string;
  rendimiento: string;
  tiempo_estimado: string;
  pasos: string[];
  tips: string[];
  foto_url?: string | null;
  fuente: string;
  cached: boolean;
}

const RecetasPage: React.FC = () => {
  const { token } = useAuth();
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [selectedPlato, setSelectedPlato] = useState<Plato | null>(null);
  const [basePlatoId, setBasePlatoId] = useState<number | ''>('');
  const [recetaPasos, setRecetaPasos] = useState<RecetaPasos | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [savingBaseRecipe, setSavingBaseRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(false);
  const [draftRecipe, setDraftRecipe] = useState<RecetaPasos | null>(null);
  const [error, setError] = useState('');
  const [baseMessage, setBaseMessage] = useState('');
  const [query, setQuery] = useState('');
  const [insumoQuery, setInsumoQuery] = useState('');
  const [selectedInsumos, setSelectedInsumos] = useState<number[]>([]);
  const [ingredientQuantities, setIngredientQuantities] = useState<Record<number, number>>({});
  const [nuevoPlato, setNuevoPlato] = useState('');
  const [descripcionPlato, setDescripcionPlato] = useState('');
  const [recetaSugerida, setRecetaSugerida] = useState<PlatoSuggestion | null>(null);
  const [sugerenciaStatus, setSugerenciaStatus] = useState('');
  const [sugerenciaError, setSugerenciaError] = useState('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  const filteredPlatos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return platos;
    return platos.filter(plato => plato.nombre.toLowerCase().includes(normalized));
  }, [platos, query]);

  const basePlato = useMemo(() => (
    platos.find(plato => plato.id === Number(basePlatoId)) || null
  ), [platos, basePlatoId]);

  const recetaBaseUnica = useMemo(() => {
    const map = new Map<number, RecetaItem>();
    for (const item of basePlato?.receta || []) {
      const key = item.insumo_id || item.insumo.id;
      if (!map.has(key)) map.set(key, { ...item, insumo_id: key });
    }
    return Array.from(map.values());
  }, [basePlato]);

  const filteredInsumos = useMemo(() => {
    const normalized = insumoQuery.trim().toLowerCase();
    const usados = new Set(recetaBaseUnica.map(item => item.insumo_id || item.insumo.id));
    return insumos
      .filter(insumo => !usados.has(insumo.id))
      .filter(insumo => !normalized || `${insumo.nombre} ${insumo.unidad_medida}`.toLowerCase().includes(normalized));
  }, [insumos, insumoQuery, recetaBaseUnica]);

  const fetchPlatos = async () => {
    const res = await fetch('/api/platos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setPlatos(data);
      if (!basePlatoId && data[0]) setBasePlatoId(data[0].id);
      return data as Plato[];
    }
    return platos;
  };

  const fetchInsumos = async () => {
    const res = await fetch('/api/insumos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setInsumos(await res.json());
  };

  const refreshPlatosKeepingSelection = async () => {
    const data = await fetchPlatos();
    if (basePlatoId && !data.some(plato => plato.id === Number(basePlatoId)) && data[0]) {
      setBasePlatoId(data[0].id);
    }
  };

  const openRecipe = async (plato: Plato, regenerate = false) => {
    setSelectedPlato(plato);
    setRecetaPasos(null);
    setError('');
    setLoadingRecipe(true);

    try {
      const res = await fetch(
        regenerate ? `/api/platos/${plato.id}/receta-pasos/regenerar` : `/api/platos/${plato.id}/receta-pasos`,
        {
          method: regenerate ? 'POST' : 'GET',
          headers: authHeaders
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la receta');
      setRecetaPasos(data);
      setDraftRecipe(data);
      setEditingRecipe(false);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la receta');
    } finally {
      setLoadingRecipe(false);
    }
  };

  const updateDraft = (patch: Partial<RecetaPasos>) => {
    setDraftRecipe(current => current ? { ...current, ...patch } : current);
  };

  const updateDraftList = (field: 'pasos' | 'tips', index: number, value: string) => {
    setDraftRecipe(current => {
      if (!current) return current;
      const next = [...current[field]];
      next[index] = value;
      return { ...current, [field]: next };
    });
  };

  const addDraftListItem = (field: 'pasos' | 'tips') => {
    setDraftRecipe(current => current ? { ...current, [field]: [...current[field], ''] } : current);
  };

  const removeDraftListItem = (field: 'pasos' | 'tips', index: number) => {
    setDraftRecipe(current => {
      if (!current) return current;
      return { ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft({ foto_url: String(reader.result || '') });
      setEditingRecipe(true);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveRecipeEdits = async () => {
    if (!selectedPlato || !draftRecipe) return;

    setSavingRecipe(true);
    setError('');
    try {
      const res = await fetch(`/api/platos/${selectedPlato.id}/receta-pasos`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(draftRecipe)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la receta');
      setRecetaPasos(data);
      setDraftRecipe(data);
      setEditingRecipe(false);
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la receta');
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleSugerirPlato = async () => {
    const nombre = nuevoPlato.trim();
    if (!nombre) {
      setSugerenciaError('Escribe el nombre del plato primero.');
      return;
    }

    setSugerenciaStatus('Gemini está sugiriendo insumos...');
    setSugerenciaError('');
    setRecetaSugerida(null);

    try {
      const res = await fetch(`/api/platos/sugerir?nombre=${encodeURIComponent(nombre)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo sugerir el plato');
      setDescripcionPlato(data.descripcion || descripcionPlato);
      setRecetaSugerida(data);
      setSugerenciaStatus('Sugerencia lista. Revísala antes de guardar.');
    } catch (err: any) {
      setSugerenciaError(err.message || 'No se pudo sugerir el plato');
      setSugerenciaStatus('');
    }
  };

  const updateRecetaSugerida = (insumoId: number, cantidad: number) => {
    setRecetaSugerida(current => current ? {
      ...current,
      receta: current.receta.map(item => item.insumo_id === insumoId ? { ...item, cantidad_por_porcion: cantidad } : item)
    } : current);
  };

  const removeRecetaSugerida = (insumoId: number) => {
    setRecetaSugerida(current => current ? {
      ...current,
      receta: current.receta.filter(item => item.insumo_id !== insumoId)
    } : current);
  };

  const handleCrearPlato = async (event: React.FormEvent) => {
    event.preventDefault();
    const nombre = nuevoPlato.trim();
    if (!nombre) return;

    setSugerenciaStatus('Guardando plato...');
    setSugerenciaError('');

    try {
      const res = await fetch('/api/platos', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          nombre,
          descripcion: descripcionPlato || recetaSugerida?.descripcion || '',
          receta: recetaSugerida?.receta || []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el plato');
      setNuevoPlato('');
      setDescripcionPlato('');
      setRecetaSugerida(null);
      setSugerenciaStatus('Plato guardado en recetas.');
      await refreshPlatosKeepingSelection();
      setBasePlatoId(data.id);
    } catch (err: any) {
      setSugerenciaError(err.message || 'No se pudo guardar el plato');
      setSugerenciaStatus('');
    }
  };

  const toggleInsumo = (insumo: Insumo) => {
    setSelectedInsumos(current => {
      if (current.includes(insumo.id)) return current.filter(id => id !== insumo.id);
      return [...current, insumo.id];
    });
    setIngredientQuantities(current => ({
      ...current,
      [insumo.id]: current[insumo.id] || 0
    }));
  };

  const handleAgregarRecetaMultiple = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!basePlato || selectedInsumos.length === 0) return;

    const items = selectedInsumos
      .map(id => {
        const insumo = insumos.find(item => item.id === id);
        return insumo ? {
          insumo,
          cantidad: Number(ingredientQuantities[id] || 0)
        } : null;
      })
      .filter((item): item is { insumo: Insumo; cantidad: number } => Boolean(item && item.cantidad > 0));

    if (items.length === 0) {
      setBaseMessage('Selecciona insumos y escribe cantidades mayores a cero.');
      return;
    }

    setSavingBaseRecipe(true);
    setBaseMessage('');

    try {
      for (const item of items) {
        const res = await fetch(`/api/platos/${basePlato.id}/receta`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            insumo_id: item.insumo.id,
            cantidad_por_porcion: item.cantidad,
            unidad_medida: item.insumo.unidad_medida
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `No se pudo guardar ${item.insumo.nombre}`);
      }
      setSelectedInsumos([]);
      setIngredientQuantities({});
      setInsumoQuery('');
      await refreshPlatosKeepingSelection();
      setBaseMessage('Receta base actualizada.');
    } catch (err: any) {
      setBaseMessage(err.message || 'No se pudo actualizar la receta base.');
    } finally {
      setSavingBaseRecipe(false);
    }
  };

  const handleActualizarRecetaCantidad = async (item: RecetaItem, cantidad: number) => {
    if (!basePlato || cantidad <= 0) return;

    setSavingBaseRecipe(true);
    setBaseMessage('');
    try {
      const res = await fetch(`/api/platos/${basePlato.id}/receta/${item.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          cantidad_por_porcion: cantidad,
          unidad_medida: item.unidad_medida
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el insumo');
      await refreshPlatosKeepingSelection();
      setBaseMessage('Cantidad actualizada.');
    } catch (err: any) {
      setBaseMessage(err.message || 'No se pudo actualizar el insumo.');
    } finally {
      setSavingBaseRecipe(false);
    }
  };

  const handleEliminarReceta = async (item: RecetaItem) => {
    if (!basePlato) return;

    setSavingBaseRecipe(true);
    setBaseMessage('');
    try {
      const res = await fetch(`/api/platos/${basePlato.id}/receta/${item.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo quitar el insumo');
      await refreshPlatosKeepingSelection();
      setBaseMessage('Insumo quitado de la receta.');
    } catch (err: any) {
      setBaseMessage(err.message || 'No se pudo quitar el insumo.');
    } finally {
      setSavingBaseRecipe(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPlatos(), fetchInsumos()]);
      setLoading(false);
    };
    load();
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', margin: 0 }}>
          <Utensils size={26} /> Recetas
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Crea platos, define varios insumos base por porción y consulta el paso a paso operativo de cocina.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1rem', alignItems: 'start', marginBottom: '1rem' }}>
        <section className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Nuevo plato</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Guarda el plato y su receta base inicial.
              </p>
            </div>
            <Sparkles size={20} color="#0f766e" />
          </div>

          <form onSubmit={handleCrearPlato} style={{ display: 'grid', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre del plato</label>
              <input className="input-field" value={nuevoPlato} onChange={event => setNuevoPlato(event.target.value)} placeholder="Ej: Majadito de pollo" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción</label>
              <textarea className="input-field" value={descripcionPlato} onChange={event => setDescripcionPlato(event.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" type="button" onClick={handleSugerirPlato} style={{ display: 'inline-flex', gap: '0.45rem', justifyContent: 'center' }}>
                <Bot size={16} /> Sugerir con IA
              </button>
              <button className="btn-primary" type="submit" style={{ display: 'inline-flex', gap: '0.45rem', justifyContent: 'center' }}>
                <Save size={16} /> Guardar plato
              </button>
            </div>
          </form>

          {(sugerenciaStatus || sugerenciaError) && (
            <p style={{ color: sugerenciaError ? '#b91c1c' : 'var(--text-muted)', marginTop: '0.75rem', fontWeight: 700 }}>
              {sugerenciaError || sugerenciaStatus}
            </p>
          )}

          {recetaSugerida && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'grid', gap: '0.65rem' }}>
              <strong>Receta sugerida</strong>
              {recetaSugerida.receta.map(item => (
                <div key={item.insumo_id} style={{ display: 'grid', gridTemplateColumns: '1fr 96px 38px', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.insumo.nombre} ({item.unidad_medida})</span>
                  <input
                    className="input-field"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.cantidad_por_porcion}
                    onChange={event => updateRecetaSugerida(item.insumo_id, Number(event.target.value))}
                    style={{ marginTop: 0 }}
                  />
                  <button className="btn-secondary" type="button" onClick={() => removeRecetaSugerida(item.insumo_id)} style={{ padding: '0.45rem' }} aria-label="Quitar insumo sugerido">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Editar receta base</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Elige un plato y agrega varios insumos por porción en una sola pasada.
              </p>
            </div>
            <span style={{ borderRadius: 999, padding: '0.35rem 0.65rem', background: '#ecfeff', color: '#155e75', fontWeight: 800, fontSize: '0.78rem' }}>
              Por porción
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Plato</label>
            <select className="input-field" value={basePlatoId} onChange={event => setBasePlatoId(Number(event.target.value))}>
              {platos.map(plato => <option key={plato.id} value={plato.id}>{plato.nombre}</option>)}
            </select>
          </div>

          {basePlato && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 0.85rem', background: '#f8fafc', fontWeight: 800 }}>
                  Insumos actuales de {basePlato.nombre}
                </div>
                {recetaBaseUnica.length === 0 ? (
                  <p style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Todavía no hay insumos cargados para este plato.</p>
                ) : (
                  <div style={{ display: 'grid', overflowX: 'auto' }}>
                    {recetaBaseUnica.map(item => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 116px 72px 38px', gap: '0.55rem', alignItems: 'center', padding: '0.7rem 0.85rem', borderTop: '1px solid var(--border-color)', minWidth: '420px' }}>
                        <strong>{item.insumo.nombre}</strong>
                        <input
                          className="input-field"
                          type="number"
                          step="0.01"
                          min="0.01"
                          defaultValue={item.cantidad_por_porcion}
                          onBlur={event => handleActualizarRecetaCantidad(item, Number(event.target.value))}
                          style={{ marginTop: 0 }}
                        />
                        <span style={{ fontWeight: 800 }}>{item.unidad_medida}</span>
                        <button className="btn-secondary" type="button" onClick={() => handleEliminarReceta(item)} disabled={savingBaseRecipe} style={{ padding: '0.45rem' }} aria-label="Quitar insumo">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAgregarRecetaMultiple} style={{ display: 'grid', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Agregar insumos</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="input-field"
                      value={insumoQuery}
                      onChange={event => setInsumoQuery(event.target.value)}
                      placeholder="Buscar insumo"
                      style={{ marginTop: 0, paddingLeft: '2.4rem' }}
                    />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {filteredInsumos.length === 0 ? (
                    <p style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>No hay insumos disponibles para agregar.</p>
                  ) : filteredInsumos.map(insumo => {
                    const checked = selectedInsumos.includes(insumo.id);
                    return (
                      <label key={insumo.id} style={{ display: 'grid', gridTemplateColumns: checked ? '24px 1fr 110px' : '24px 1fr', gap: '0.6rem', alignItems: 'center', padding: '0.7rem 0.85rem', borderTop: '1px solid var(--border-color)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleInsumo(insumo)} />
                        <span>
                          <strong>{insumo.nombre}</strong>
                          <small style={{ display: 'block', color: 'var(--text-muted)' }}>{insumo.unidad_medida}</small>
                        </span>
                        {checked && (
                          <input
                            className="input-field"
                            type="number"
                            step="0.01"
                            min="0"
                            value={ingredientQuantities[insumo.id] || ''}
                            onChange={event => setIngredientQuantities(current => ({ ...current, [insumo.id]: Number(event.target.value) }))}
                            placeholder="Cant."
                            onClick={event => event.stopPropagation()}
                            style={{ marginTop: 0 }}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: baseMessage.includes('No se') || baseMessage.includes('Selecciona') ? '#b91c1c' : 'var(--text-muted)', fontWeight: 700 }}>
                    {baseMessage || `${selectedInsumos.length} insumos seleccionados`}
                  </span>
                  <button className="btn-primary" type="submit" disabled={savingBaseRecipe || selectedInsumos.length === 0} style={{ display: 'inline-flex', gap: '0.45rem', justifyContent: 'center' }}>
                    <Check size={16} /> {savingBaseRecipe ? 'Guardando...' : 'Agregar a receta'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>

      <section className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <input
          className="input-field"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar plato para ver el paso a paso"
          style={{ marginTop: 0 }}
        />
      </section>

      {loading ? (
        <div className="card" style={{ padding: '1.25rem' }}>Cargando recetas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {filteredPlatos.map(plato => (
            <article key={plato.id} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>{plato.nombre}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {plato.descripcion || 'Sin descripción registrada.'}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {new Set((plato.receta || []).map(item => item.insumo_id || item.insumo.id)).size} insumos base
                </span>
                <button className="btn-primary" type="button" onClick={() => openRecipe(plato)}>
                  Ver receta
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedPlato && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.38)', zIndex: 300, display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="card"
            style={{ width: 'min(760px, 100%)', maxHeight: '88vh', overflowY: 'auto', padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>{selectedPlato.nombre}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{selectedPlato.descripcion || 'Receta operativa para cocina.'}</p>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setSelectedPlato(null)} style={{ padding: '0.5rem' }} aria-label="Cerrar receta">
                <X size={18} />
              </button>
            </div>

            {loadingRecipe ? (
              <div style={{ border: '1px solid #dbeafe', borderRadius: '8px', padding: '1rem', background: 'linear-gradient(135deg, #eff6ff, #f7fee7)', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div className="ai-robot-icon is-thinking">
                  <Bot size={22} />
                  <span className="ai-gear ai-gear-one" />
                  <span className="ai-gear ai-gear-two" />
                </div>
                <div>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#075985' }}>
                    <Sparkles size={16} /> Gemini está armando el paso a paso
                  </strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Si es la primera vez, puede tardar un poco. Luego queda guardado en la base de datos.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div style={{ border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            ) : recetaPasos && draftRecipe && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" type="button" onClick={() => setEditingRecipe(value => !value)} style={{ display: 'inline-flex', justifyContent: 'center', gap: '0.45rem' }}>
                    <Edit3 size={16} /> {editingRecipe ? 'Ver receta' : 'Editar receta'}
                  </button>
                  {editingRecipe ? (
                    <button className="btn-primary" type="button" onClick={saveRecipeEdits} disabled={savingRecipe} style={{ display: 'inline-flex', justifyContent: 'center', gap: '0.45rem' }}>
                      <Save size={16} /> {savingRecipe ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  ) : (
                    <button className="btn-secondary" type="button" onClick={() => openRecipe(selectedPlato, true)} style={{ display: 'inline-flex', justifyContent: 'center', gap: '0.45rem' }}>
                      <RefreshCw size={16} /> Regenerar con Gemini
                    </button>
                  )}
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
                  {draftRecipe.foto_url ? (
                    <img src={draftRecipe.foto_url} alt={`Foto de ${selectedPlato.nombre}`} style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ minHeight: '150px', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', background: '#eef2f7' }}>
                      <Camera size={32} />
                    </div>
                  )}
                  {editingRecipe && (
                    <div style={{ padding: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        style={{ display: 'inline-flex', gap: '0.45rem' }}
                      >
                        <Camera size={16} /> Subir foto
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                      {draftRecipe.foto_url && (
                        <button className="btn-secondary" type="button" onClick={() => updateDraft({ foto_url: '' })}>
                          Quitar foto
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editingRecipe && (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Título de la receta</label>
                      <input className="input-field" value={draftRecipe.titulo} onChange={event => updateDraft({ titulo: event.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Rendimiento</label>
                        <input className="input-field" value={draftRecipe.rendimiento} onChange={event => updateDraft({ rendimiento: event.target.value })} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Tiempo estimado</label>
                        <input className="input-field" value={draftRecipe.tiempo_estimado} onChange={event => updateDraft({ tiempo_estimado: event.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.9rem', background: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Rendimiento</span>
                    <strong style={{ display: 'block' }}>{draftRecipe.rendimiento}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Tiempo</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={16} /> {draftRecipe.tiempo_estimado}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Fuente</span>
                    <strong style={{ display: 'block' }}>{draftRecipe.fuente === 'chef' ? 'Editada por chef' : recetaPasos.cached ? 'Guardada en BD' : 'Generada por Gemini'}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {draftRecipe.pasos.map((paso, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: editingRecipe ? '34px 1fr 34px' : '34px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {index + 1}
                      </span>
                      {editingRecipe ? (
                        <textarea className="input-field" value={paso} onChange={event => updateDraftList('pasos', index, event.target.value)} rows={3} style={{ marginTop: 0, resize: 'vertical' }} />
                      ) : (
                        <p style={{ color: 'var(--text-primary)', lineHeight: 1.55 }}>{paso}</p>
                      )}
                      {editingRecipe && (
                        <button className="btn-secondary" type="button" onClick={() => removeDraftListItem('pasos', index)} style={{ padding: '0.35rem' }} aria-label="Quitar paso">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  {editingRecipe && (
                    <button className="btn-secondary" type="button" onClick={() => addDraftListItem('pasos')} style={{ display: 'inline-flex', justifyContent: 'center', gap: '0.45rem' }}>
                      <Plus size={16} /> Agregar paso
                    </button>
                  )}
                </div>

                {(draftRecipe.tips.length > 0 || editingRecipe) && (
                  <div style={{ border: '1px solid #dbeafe', borderRadius: '8px', padding: '0.9rem', background: '#eff6ff' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#075985', marginBottom: '0.45rem' }}>
                      <Sparkles size={16} /> Tips de cocina
                    </strong>
                    {editingRecipe ? (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {draftRecipe.tips.map((tip, index) => (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 34px', gap: '0.5rem' }}>
                            <input className="input-field" value={tip} onChange={event => updateDraftList('tips', index, event.target.value)} style={{ marginTop: 0 }} />
                            <button className="btn-secondary" type="button" onClick={() => removeDraftListItem('tips', index)} style={{ padding: '0.35rem' }} aria-label="Quitar tip">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                        <button className="btn-secondary" type="button" onClick={() => addDraftListItem('tips')} style={{ display: 'inline-flex', justifyContent: 'center', gap: '0.45rem' }}>
                          <Plus size={16} /> Agregar tip
                        </button>
                      </div>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-primary)' }}>
                        {draftRecipe.tips.map(tip => <li key={tip}>{tip}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.section>
        </div>
      )}
    </motion.div>
  );
};

export default RecetasPage;
