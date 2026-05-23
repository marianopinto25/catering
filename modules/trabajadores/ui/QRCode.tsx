import React from 'react';
import { makeQrMatrix } from './qr';

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 144 }) => {
  let matrix: boolean[][];
  try {
    matrix = makeQrMatrix(value);
  } catch {
    return <div style={{ color: 'var(--danger-color)', fontWeight: 700 }}>QR no disponible</div>;
  }

  const quiet = 4;
  const count = matrix.length + quiet * 2;
  const cell = size / count;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Código QR">
      <rect width={size} height={size} fill="#fff" />
      {matrix.flatMap((row, r) => row.map((dark, c) => dark ? (
        <rect
          key={`${r}-${c}`}
          x={(c + quiet) * cell}
          y={(r + quiet) * cell}
          width={Math.ceil(cell)}
          height={Math.ceil(cell)}
          fill="#000"
        />
      ) : null))}
    </svg>
  );
};

export default QRCode;
