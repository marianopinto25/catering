-- Sprint 3: proveedor responsable y solicitudes internas de cocina.
ALTER TABLE "Proveedor" ADD COLUMN "responsable_nombre" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Proveedor" ADD COLUMN "responsable_cargo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Proveedor" ADD COLUMN "responsable_telefono" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Proveedor" ADD COLUMN "responsable_email" TEXT NOT NULL DEFAULT '';

CREATE TABLE "SolicitudInsumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "insumo_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_solicitud" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,
    CONSTRAINT "SolicitudInsumo_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudInsumo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
