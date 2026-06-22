import { FastifyInstance } from 'fastify'

export async function rutasRoutes(fastify: FastifyInstance) {

  // ── GET /api/rutas/explorar ──────────────────────────────────────────
  // Lista rutas disponibles para descubrir. "Disponible" = no cancelada.
  // Pública.
  fastify.get('/explorar', async (req, reply) => {
    const rutas = await fastify.prisma.ruta.findMany({
      where: { estado: { not: 'CANCELADA' } },
      include: { pois: true },
      orderBy: { creadoEn: 'desc' }
    })

    const resumenes = rutas.map((ruta) => ({
      id: ruta.id,
      nombre: ruta.nombre,
      resumenCorto: ruta.resumenCorto ?? ruta.descripcion?.slice(0, 80) ?? '',
      tiempoEstimadoMin: ruta.tiempoEstimadoMin ?? 0,
      dificultad: ruta.dificultad ?? 'facil',
      cantidadPois: ruta.pois.length,
      imagenPortada: ruta.imagenPortada
    }))

    return resumenes
  })

  // ── GET /api/rutas/activa ────────────────────────────────────────────
  // Ruta que el usuario está siguiendo ahora mismo (UsuarioRutaActiva
  // con estado EN_PROGRESO). 🔒 Requiere login.
  // OJO: va antes de "/:id" — ver nota al final del archivo.
  fastify.get('/activa', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const usuarioId = (req.user as any).sub

    const activa = await fastify.prisma.usuarioRutaActiva.findFirst({
      where: { usuarioId, estado: 'EN_PROGRESO' },
      include: {
        ruta: { include: { pois: { include: { poi: true }, orderBy: { orden: 'asc' } } } }
      },
      orderBy: { iniciadaEn: 'desc' }
    })

    if (!activa) return reply.send(null)
    return activa
  })

  // ── GET /api/rutas/:id ───────────────────────────────────────────────
  // Detalle completo de una ruta con sus POIs ordenados. Pública.
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as any

    const ruta = await fastify.prisma.ruta.findUnique({
      where: { id },
      include: {
        pois: { include: { poi: true }, orderBy: { orden: 'asc' } }
      }
    })

    if (!ruta) return reply.code(404).send({ error: 'Ruta no encontrada' })
    return ruta
  })
    fastify.patch('/:id', async (req, reply) => {
    const { id } = req.params as any
    const body = req.body as any

    const ruta = await fastify.prisma.ruta.findUnique({ where: { id } })
    if (!ruta) return reply.code(404).send({ error: 'Ruta no encontrada' })

    const actualizada = await fastify.prisma.ruta.update({
      where: { id },
      data: {
        nombre: body.nombre ?? ruta.nombre,
        descripcion: body.descripcion ?? ruta.descripcion,
        resumenCorto: body.resumenCorto ?? ruta.resumenCorto,
        tiempoEstimadoMin: body.tiempoEstimadoMin ?? ruta.tiempoEstimadoMin,
        dificultad: body.dificultad ?? ruta.dificultad,
        imagenPortada: body.imagenPortada ?? ruta.imagenPortada
      }
    })

    return actualizada
  })

  // ── POST /api/rutas ───────────────────────────────────────────────────
  // Crea una ruta oficial (curada por el admin). usuarioId queda null.
  // Pública por ahora.
  fastify.post('/', async (req, reply) => {
    const body = req.body as any

    if (!body.nombre || !Array.isArray(body.poisIds) || body.poisIds.length === 0) {
      return reply.code(400).send({ error: 'Faltan campos requeridos: nombre, poisIds' })
    }

    const ruta = await fastify.prisma.ruta.create({
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion ?? null,
        resumenCorto: body.resumenCorto ?? null,
        tiempoEstimadoMin: body.tiempoEstimadoMin ?? null,
        dificultad: body.dificultad ?? 'facil',
        imagenPortada: body.imagenPortada ?? null,
        estado: 'PENDIENTE',
        pois: {
          create: body.poisIds.map((poiId: string, orden: number) => ({ poiId, orden }))
        }
      },
      include: { pois: { include: { poi: true }, orderBy: { orden: 'asc' } } }
    })

    return reply.code(201).send(ruta)
  })

  // ── POST /api/rutas/:id/iniciar ──────────────────────────────────────
  // Usuario empieza a seguir una ruta oficial. 🔒 Requiere login.
  fastify.post('/:id/iniciar', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { id: rutaId } = req.params as any
    const usuarioId = (req.user as any).sub

    const ruta = await fastify.prisma.ruta.findUnique({ where: { id: rutaId } })
    if (!ruta) return reply.code(404).send({ error: 'Ruta no encontrada' })

    // Cierra cualquier ruta activa previa del usuario (solo una a la vez)
    await fastify.prisma.usuarioRutaActiva.updateMany({
      where: { usuarioId, estado: 'EN_PROGRESO' },
      data: { estado: 'CANCELADA' }
    })

    const activa = await fastify.prisma.usuarioRutaActiva.create({
      data: { usuarioId, rutaId, estado: 'EN_PROGRESO' }
    })

    return reply.code(201).send(activa)
  })

  // ── POST /api/rutas/:id/visita ───────────────────────────────────────
  // Registra visita a un POI (geofence trigger) y verifica misiones.
  // 🔒 Requiere login.
  fastify.post('/:id/visita', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { poiId } = req.body as any
    const usuarioId = (req.user as any).sub

    if (!poiId) return reply.code(400).send({ error: 'poiId es requerido' })

    const visita = await fastify.prisma.visita.create({
      data: { usuarioId, poiId }
    })

    await verificarMisiones(fastify.prisma, usuarioId, poiId)

    return reply.code(201).send(visita)
  })
}

async function verificarMisiones(prisma: any, usuarioId: string, poiId: string) {
  const misiones = await prisma.usuarioMision.findMany({
    where: { usuarioId, estado: 'EN_PROGRESO' },
    include: { mision: true }
  })
  for (const um of misiones) {
    if (um.mision.tipo === 'VISITAR_POI' && um.mision.poiId === poiId) {
      await prisma.usuarioMision.update({
        where: { id: um.id },
        data: { estado: 'COMPLETADA', completadaEn: new Date() }
      })
    }
  }
}