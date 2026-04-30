-- Sprint 4: menú mensual, platos y receta mínima.
CREATE TABLE "Plato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo'
);

CREATE TABLE "PlatoInsumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plato_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "cantidad_por_porcion" REAL NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    CONSTRAINT "PlatoInsumo_plato_id_fkey" FOREIGN KEY ("plato_id") REFERENCES "Plato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlatoInsumo_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MenuMes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR'
);

CREATE TABLE "MenuItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menu_mes_id" INTEGER NOT NULL,
    "plato_id" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "dia" TEXT NOT NULL,
    "turno" TEXT NOT NULL DEFAULT 'Almuerzo',
    "porciones_estimadas" INTEGER NOT NULL,
    CONSTRAINT "MenuItem_menu_mes_id_fkey" FOREIGN KEY ("menu_mes_id") REFERENCES "MenuMes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MenuItem_plato_id_fkey" FOREIGN KEY ("plato_id") REFERENCES "Plato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Plato_nombre_key" ON "Plato"("nombre");
CREATE UNIQUE INDEX "PlatoInsumo_plato_id_insumo_id_key" ON "PlatoInsumo"("plato_id", "insumo_id");
CREATE UNIQUE INDEX "MenuMes_anio_mes_key" ON "MenuMes"("anio", "mes");
CREATE UNIQUE INDEX "MenuItem_menu_mes_id_semana_dia_turno_key" ON "MenuItem"("menu_mes_id", "semana", "dia", "turno");
