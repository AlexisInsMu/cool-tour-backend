import { FastifyInstance } from 'fastify'

export async function rutasRoutes(fastify: FastifyInstance) {
  // POST /api/rutas — guardar ruta generada por el usuario (KT-06)
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { nombre, poisIds } = req.body as any
    const usuarioId = (req.user as any).sub

    const ruta = await fastify.prisma.ruta.create({
      data: {
        nombre,
        usuarioId,
        pois: {
          create: poisIds.map((poiId: string, orden: number) => ({ poiId, orden }))
        }
      },
      include: { pois: { include: { poi: true }, orderBy: { orden: 'asc' } } }
    })
    return reply.code(201).send(ruta)
  })

  // GET /api/rutas/mis-rutas — rutas del usuario autenticado
  fastify.get('/mis-rutas', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const usuarioId = (req.user as any).sub
    const rutas = await fastify.prisma.ruta.findMany({
      where: { usuarioId },
      include: { pois: { include: { poi: true }, orderBy: { orden: 'asc' } } },
      orderBy: { creadoEn: 'desc' }
    })
    return rutas
  })

  // POST /api/rutas/:id/visita — registrar visita a POI en ruta activa (KT-13)
  fastify.post('/:id/visita', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { poiId } = req.body as any
    const usuarioId = (req.user as any).sub

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
