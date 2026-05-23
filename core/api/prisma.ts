import { PrismaClient } from '@prisma/client';

/**
 * Singleton de PrismaClient compartido por todos los módulos.
 * Importar desde core/api/prisma.ts — nunca crear new PrismaClient() en los módulos.
 */
import path from 'path';

const dbPath = path.join(__dirname, '../../prisma/dev.db');

export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || `file:${dbPath}` },
  },
});
