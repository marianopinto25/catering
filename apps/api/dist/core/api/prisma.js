"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
/**
 * Singleton de PrismaClient compartido por todos los módulos.
 * Importar desde core/api/prisma.ts — nunca crear new PrismaClient() en los módulos.
 */
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../prisma/dev.db');
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL || `file:${dbPath}` },
    },
});
