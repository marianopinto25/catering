-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nit_rut" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "telefono" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo'
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nit_rut_key" ON "Proveedor"("nit_rut");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_razon_social_key" ON "Proveedor"("razon_social");
