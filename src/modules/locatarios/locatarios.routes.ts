import bcrypt from 'bcrypt'
import { FastifyInstance } from 'fastify'

export async function locatariosRoutes(fastify: FastifyInstance) {

  // ...tus endpoints existentes (registrar, GET /, GET /:id)

  // ── POST /api/locatarios/login ───────────────────────────────────────
  // Login del locatario. Devuelve JWT con rol "locatario" en el payload.
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body as any

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email y password son requeridos' })
    }

    const locatario = await fastify.prisma.locatario.findUnique({
      where: { email }
    })

    if (!locatario || !locatario.activo) {
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    const valido = await bcrypt.compare(password, locatario.passwordHash)
    if (!valido) {
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    // JWT con rol "locatario" para que Android sepa distinguirlo del usuario normal
    const token = fastify.jwt.sign({
      sub: locatario.id,
      email: locatario.email,
      rol: 'locatario'
    })

    return {
      token,
      locatario: {
        id: locatario.id,
        nombre: locatario.nombre,
        negocio: locatario.negocio,
        plan: locatario.plan
      }
    }
  })

  // ── GET /api/locatarios/mis-pois ─────────────────────────────────────
  // POIs del locatario autenticado. 🔒 Requiere JWT de locatario.
  // OJO: va ANTES de /:id para que Fastify no confunda "mis-pois" con un id.
  fastify.get('/mis-pois', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const locatarioId = (req.user as any).sub

    // Verificar que el token es de un locatario, no de un usuario normal
    if ((req.user as any).rol !== 'locatario') {
      return reply.code(403).send({ error: 'Acceso solo para locatarios' })
    }

    const pois = await fastify.prisma.pOI.findMany({
      where: { locatarioId, activo: true },
      orderBy: { creadoEn: 'desc' }
    })

    return pois
  })
}