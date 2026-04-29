import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { activeModules } from '../../../core/api/modules';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montar todos los módulos activos desde el registry
for (const mod of activeModules) {
  app.use(mod.path, mod.router);
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
