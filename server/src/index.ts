import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import proveedoresRoutes from './routes/proveedores.routes';
import authRoutes from './routes/auth.routes';
import comprasRoutes from './routes/compras.routes';
import insumosRoutes from './routes/insumos.routes';
import inventarioRoutes from './routes/inventario.routes';
import alertasRoutes from './routes/alertas.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/alertas', alertasRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
