import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, CheckCircle2, ClipboardCheck, ImagePlus, X } from 'lucide-react';
import jsQR from 'jsqr';
import { useAuth } from '@core/AuthContext';
import SignaturePad from './SignaturePad';

interface Consumo {
  id: number;
  fecha: string;
  turno: string;
  metodo: string;
  registrado_en?: string;
  firmaBase64?: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);
const turnos = ['Desayuno', 'Almuerzo', 'Cena'];

const MiConsumoPage: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const [fecha] = useState(today());
  const initialTurno = searchParams.get('turno') || 'Almuerzo';
  const [turno, setTurno] = useState(turnos.includes(initialTurno) ? initialTurno : 'Almuerzo');
  const [metodo, setMetodo] = useState<'SESION' | 'QR'>('SESION');
  const [codigoQr, setCodigoQr] = useState('');
  const [consumo, setConsumo] = useState<Consumo | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const loadMiConsumo = async () => {
    setError('');
    const res = await fetch(`/api/consumos/mio?fecha=${fecha}&turno=${encodeURIComponent(turno)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo consultar tu consumo');
    setConsumo(data);
    setMessage(data ? 'Ya registraste este turno hoy.' : '');
  };

  useEffect(() => {
    if (!token) return;
    loadMiConsumo().catch((err: any) => setError(err.message));
  }, [token, turno]);

  const applyQrValue = (rawValue: string) => {
    const value = rawValue.trim();
    try {
      const parsed = new URL(value);
      const qrTurno = parsed.searchParams.get('turno');
      if (qrTurno && turnos.includes(qrTurno)) {
        setTurno(qrTurno);
        setMetodo('SESION');
        setCodigoQr('');
        setMessage(`QR del día leído para ${qrTurno}.`);
        return;
      }
    } catch {
      // Not a URL: treat it as a worker QR code.
    }
    setMetodo('QR');
    setCodigoQr(value);
    setMessage('Código QR leído. Ahora puedes registrar tu consumo.');
  };

  const stopScanner = () => {
    if (scanFrameRef.current) window.cancelAnimationFrame(scanFrameRef.current);
    scanFrameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setScannerOpen(false);
  };

  useEffect(() => () => stopScanner(), []);

  const scanCanvasForQr = (source: HTMLVideoElement | HTMLImageElement | ImageBitmap) => {
    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (!width || !height) return '';

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '';
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return jsQR(imageData.data, imageData.width, imageData.height)?.data || '';
  };

  const startScanner = async () => {
    setScannerError('');
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      captureInputRef.current?.click();
      setScannerError('Si la cámara en vivo está bloqueada por HTTP, toma una foto del QR y la app lo lee igual.');
      return;
    }

    try {
      setScannerOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const scan = () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          scanFrameRef.current = window.requestAnimationFrame(scan);
          return;
        }
        const code = scanCanvasForQr(video);
        if (code) {
          applyQrValue(code);
          stopScanner();
          return;
        }
        scanFrameRef.current = window.requestAnimationFrame(scan);
      };
      scanFrameRef.current = window.requestAnimationFrame(scan);
    } catch {
      stopScanner();
      captureInputRef.current?.click();
      setScannerError('No se pudo abrir cámara en vivo. Toma una foto del QR y la app lo lee automáticamente.');
    }
  };

  const scanImage = async (file?: File) => {
    if (!file) return;
    setScannerError('');
    try {
      const code = await new Promise<string>((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          const result = scanCanvasForQr(image);
          URL.revokeObjectURL(objectUrl);
          resolve(result);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('image'));
        };
        image.src = objectUrl;
      });
      if (!code) throw new Error('empty');
      applyQrValue(code);
    } catch {
      setScannerError('No se pudo leer el QR de la imagen. Intenta tomar la foto más cerca y con buena luz.');
    }
  };

  const registrar = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/consumos/mio', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          turno,
          metodo,
          codigo_qr: metodo === 'QR' ? codigoQr.trim() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar el consumo');
      setConsumo(data);
      setMessage('Consumo registrado. Firma para completar el registro.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarFirma = async (firmaBase64: string) => {
    if (!consumo) return;
    const res = await fetch(`/api/consumos/${consumo.id}/firma`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ firmaBase64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la firma');
    setConsumo({ ...consumo, firmaBase64 });
    setMessage('Firma guardada correctamente.');
  };

  const firmado = Boolean(consumo?.firmaBase64);
  const qrRequired = metodo === 'QR' && !codigoQr.trim();

  return (
    <motion.div className="mi-consumo-page" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h2>Mi Consumo</h2>
        <p style={{ color: 'var(--text-muted)' }}>Registra la comida que consumiste hoy y firma dentro del sistema.</p>
      </div>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div className="mi-consumo-controls">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="input-field" value={fecha} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Turno</label>
            <select className="input-field" value={turno} onChange={e => setTurno(e.target.value)} disabled={loading}>
              {turnos.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Método</label>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              {(['SESION', 'QR'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMetodo(option)}
                  disabled={loading || Boolean(consumo)}
                  style={{
                    border: 0,
                    padding: '0.75rem 1rem',
                    background: metodo === option ? 'var(--primary-color)' : 'var(--input-bg)',
                    color: metodo === option ? 'var(--secondary-color)' : 'var(--text-primary)',
                    cursor: consumo ? 'not-allowed' : 'pointer',
                    fontWeight: 800
                  }}
                >
                  {option === 'SESION' ? 'Sesión' : 'QR'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {metodo === 'QR' && (
          <div className="form-group">
            <label className="form-label">Código QR</label>
            <input
              className="input-field"
              value={codigoQr}
              onChange={e => setCodigoQr(e.target.value)}
              placeholder="Pega el código QR asignado por la empresa"
              disabled={Boolean(consumo)}
            />
          </div>
        )}

        <div className="mobile-action-row">
          <button className="btn-secondary" type="button" onClick={startScanner} disabled={Boolean(consumo)}>
            <Camera size={16} /> Escanear QR
          </button>
          <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: consumo ? 'not-allowed' : 'pointer', opacity: consumo ? 0.55 : 1 }}>
            <ImagePlus size={16} /> Foto del QR
            <input
              ref={captureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={Boolean(consumo)}
              onChange={event => {
                scanImage(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {scannerOpen && (
          <div className="qr-scanner-panel">
            <video ref={videoRef} className="qr-scanner-video" playsInline muted />
            <button className="btn-secondary" type="button" onClick={stopScanner}>
              <X size={16} /> Cerrar cámara
            </button>
          </div>
        )}

        {scannerError && <p className="error-text">{scannerError}</p>}

        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: firmado ? 'var(--success-color)' : 'var(--text-primary)', fontWeight: 800 }}>{message}</p>}

        <button className="btn-primary" type="button" onClick={registrar} disabled={loading || Boolean(consumo) || qrRequired} style={{ width: 'fit-content' }}>
          <ClipboardCheck size={16} /> {loading ? 'Registrando...' : consumo ? 'Consumo registrado' : 'Registrar consumo'}
        </button>
      </section>

      {consumo && (
        <section className="card" style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3>Consumo #{consumo.id}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{consumo.fecha} · {consumo.turno} · {consumo.metodo}</p>
            </div>
            {firmado && <span style={{ color: 'var(--success-color)', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={18} /> Firmado</span>}
          </div>
          {firmado ? (
            <img src={consumo.firmaBase64 || ''} alt="Firma guardada" style={{ maxWidth: '360px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)' }} />
          ) : (
            <SignaturePad title="Firma del trabajador" onSave={guardarFirma} />
          )}
        </section>
      )}
    </motion.div>
  );
};

export default MiConsumoPage;
