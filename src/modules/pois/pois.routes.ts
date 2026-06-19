import { FastifyInstance } from 'fastify'

export async function poisRoutes(fastify: FastifyInstance) {
  // GET /api/pois — todos los POIs activos
  fastify.get('/', async (req, reply) => {
    const pois = await fastify.prisma.pOI.findMany({
      where: { activo: true },
      include: { locatario: { select: { nombre: true, negocio: true } } }
    })
    return pois
  })

  // GET /api/pois/:id — detalle de un POI
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as any
    const poi = await fastify.prisma.pOI.findUnique({
      where: { id },
      include: {
        resenas: { include: { usuario: { select: { nombre: true } } } },
        locatario: true
      }
    })
    if (!poi) return reply.code(404).send({ error: 'POI no encontrado' })
    return poi
  })

  // POST /api/pois — crear POI
  fastify.post('/', async (req, reply) => {
    const data = req.body as any
    const poi = await fastify.prisma.pOI.create({ data })
    return reply.code(201).send(poi)
  })

  // GET /api/pois/qr/:codigo — buscar POI por QR (KT-11)
  fastify.get('/qr/:codigo', async (req, reply) => {
    const { codigo } = req.params as any
    const poi = await fastify.prisma.pOI.findUnique({ where: { qrCode: codigo } })
    if (!poi) return reply.code(404).send({ error: 'QR no válido' })
    return poi
  })
}
