import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Camera, Clock, Edit3, Plus, RefreshCw, Save, Sparkles, Trash2, Utensils, X } from 'lucide-react';
import { useAuth } from '@core/AuthContext';

interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
}

interface RecetaItem {
  id: number;
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
  const [selectedPlato, setSelectedPlato] = useState<Plato | null>(null);
  const [recetaPasos, setRecetaPasos] = useState<RecetaPasos | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(false);
  const [draftRecipe, setDraftRecipe] = useState<RecetaPasos | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
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

  const fetchPlatos = async () => {
    setLoading(true);
    const res = await fetch('/api/platos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setPlatos(await res.json());
    setLoading(false);
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

  useEffect(() => {
    fetchPlatos();
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', margin: 0 }}>
          <Utensils size={26} /> Recetas
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Consulta la preparación paso a paso de cada plato. Gemini la genera una vez y queda guardada para futuras consultas.
        </p>
      </header>

      <section className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <input
          className="input-field"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar plato"
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
                  {plato.receta?.length || 0} insumos base
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
