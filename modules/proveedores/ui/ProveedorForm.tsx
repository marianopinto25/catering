import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@core/AuthContext';

const ProveedorForm: React.FC = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [nit_rut, setNitRut] = useState('');
  const [razon_social, setRazonSocial] = useState('');
  const [telefono, setTelefono] = useState('');
  const [responsableNombre, setResponsableNombre] = useState('');
  const [responsableCargo, setResponsableCargo] = useState('');
  const [responsableTelefono, setResponsableTelefono] = useState('');
  const [responsableEmail, setResponsableEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchProv = async () => {
        try {
          const res = await fetch('/api/proveedores', { headers: { Authorization: `Bearer ${token}` } });
          const all = await res.json();
          const target = all.find((p: any) => p.id === Number(id));
          if (target) {
            setNitRut(target.nit_rut);
            setRazonSocial(target.razon_social);
            setTelefono(target.telefono || '');
            setResponsableNombre(target.responsable_nombre || '');
            setResponsableCargo(target.responsable_cargo || '');
            setResponsableTelefono(target.responsable_telefono || '');
            setResponsableEmail(target.responsable_email || '');
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchProv();
    }
  }, [id, isEditing, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = isEditing ? `/api/proveedores/${id}` : '/api/proveedores';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nit_rut,
          razon_social,
          telefono,
          responsable_nombre: responsableNombre,
          responsable_cargo: responsableCargo,
          responsable_telefono: responsableTelefono,
          responsable_email: responsableEmail
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Enforce specific error message requirement from CU alternative flow
        if (data.error === 'Proveedor ya registrado') {
          throw new Error('Proveedor ya registrado');
        }
        throw new Error(data.error || 'Error al guardar');
      }

      navigate('/proveedores');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>{isEditing ? 'Editar Proveedor' : 'Ingresar Nuevo Proveedor'}</h2>
        <Link to="/proveedores" className="btn-secondary">Volver</Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">NIT / RUT</label>
            <input 
              type="text" 
              className="input-field" 
              value={nit_rut} 
              onChange={e => setNitRut(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Razón Social</label>
            <input 
              type="text" 
              className="input-field" 
              value={razon_social} 
              onChange={e => setRazonSocial(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono (opcional)</label>
            <input 
              type="text" 
              className="input-field" 
              value={telefono} 
              onChange={e => setTelefono(e.target.value)} 
            />
          </div>

          <div style={{ margin: '1.5rem 0 1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Persona responsable</h3>
            <div className="form-group">
              <label className="form-label">Nombre del responsable</label>
              <input
                type="text"
                className="input-field"
                value={responsableNombre}
                onChange={e => setResponsableNombre(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input
                  type="text"
                  className="input-field"
                  value={responsableCargo}
                  onChange={e => setResponsableCargo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono directo</label>
                <input
                  type="text"
                  className="input-field"
                  value={responsableTelefono}
                  onChange={e => setResponsableTelefono(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email del responsable</label>
              <input
                type="email"
                className="input-field"
                value={responsableEmail}
                onChange={e => setResponsableEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Guardar Proveedor
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ProveedorForm;
