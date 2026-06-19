import { FastifyInstance } from 'fastify'

export async function cuponesRoutes(fastify: FastifyInstance) {
  // POST /api/cupones/validar — validar y canjear cupón (KT-12)
  fastify.post('/validar', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { codigo } = req.body as any
    const usuarioId = (req.user as any).sub

    const cupon = await fastify.prisma.cupon.findUnique({
      where: { codigo },
      include: { usos: true }
    })

    if (!cupon) return reply.code(404).send({ error: 'Cupón no existe' })
    if (new Date() > cupon.validoHasta) return reply.code(400).send({ error: 'Cupón expirado' })
    if (cupon.usos.length >= cupon.usoMaximo) return reply.code(400).send({ error: 'Cupón agotado' })

    const yaUsado = cupon.usos.find(u => u.usuarioId === usuarioId)
    if (yaUsado) return reply.code(400).send({ error: 'Ya usaste este cupón' })

    await fastify.prisma.usuarioCupon.create({
      data: { usuarioId, cuponId: cupon.id }
    })

    return { valido: true, descuento: cupon.descuento, tipo: cupon.tipo }
  })
}
