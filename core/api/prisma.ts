import { PrismaClient } from '@prisma/client';

/**
 * Singleton de PrismaClient compartido por todos los módulos.
 * Importar desde core/api/prisma.ts — nunca crear new PrismaClient() en los módulos.
 */
export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || 'file:../../prisma/dev.db' },
  },
});
