import { z } from 'zod'

export const crearRutaSchema = {
  body: z.object({
    nombre: z.string().min(3),
    descripcion: z.string().min(10),
    resumenCorto: z.string().min(5).max(120),
    tiempoEstimadoMin: z.number().int().positive(),
    dificultad: z.enum(['facil', 'media', 'dificil']).default('facil'),
    imagenPortada: z.string().url().optional(),
    poisIds: z.array(z.string()).min(1, 'La ruta necesita al menos 1 POI')
  })
}

export const visitaSchema = {
  body: z.object({
    poiId: z.string()
  })
}