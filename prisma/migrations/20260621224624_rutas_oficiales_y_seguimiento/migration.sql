-- DropForeignKey
ALTER TABLE "rutas" DROP CONSTRAINT "rutas_usuarioId_fkey";

-- AlterTable
ALTER TABLE "rutas" ADD COLUMN     "dificultad" TEXT DEFAULT 'facil',
ADD COLUMN     "imagenPortada" TEXT,
ADD COLUMN     "resumenCorto" TEXT,
ADD COLUMN     "tiempoEstimadoMin" INTEGER,
ALTER COLUMN "usuarioId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "usuario_rutas_activas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rutaId" TEXT NOT NULL,
    "estado" "EstadoRuta" NOT NULL DEFAULT 'EN_PROGRESO',
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadaEn" TIMESTAMP(3),

    CONSTRAINT "usuario_rutas_activas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_rutas_activas_usuarioId_rutaId_key" ON "usuario_rutas_activas"("usuarioId", "rutaId");

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rutas_activas" ADD CONSTRAINT "usuario_rutas_activas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rutas_activas" ADD CONSTRAINT "usuario_rutas_activas_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
