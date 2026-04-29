"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
/**
 * Singleton de PrismaClient compartido por todos los módulos.
 * Importar desde core/api/prisma.ts — nunca crear new PrismaClient() en los módulos.
 */
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL || 'file:../../prisma/dev.db' },
    },
});
