import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Save } from 'lucide-react';

interface SignaturePadProps {
  title: string;
  disabled?: boolean;
  onSave: (firmaBase64: string) => Promise<void> | void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ title, disabled, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [saving, setSaving] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#0f172a';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#fff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    setupCanvas();
    setHasInk(false);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    setSaving(true);
    try {
      await onSave(canvas.toDataURL('image/png'));
      clear();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <label className="form-label">{title}</label>
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        style={{
          width: '100%',
          height: '220px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: 'var(--card-bg)',
          touchAction: 'none',
          cursor: disabled ? 'not-allowed' : 'crosshair'
        }}
      />
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" className="btn-secondary" onClick={clear} disabled={disabled || saving}>
          <Eraser size={16} /> Limpiar firma
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={disabled || saving || !hasInk}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar firma'}
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
