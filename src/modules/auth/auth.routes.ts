import { FastifyInstance } from 'fastify'
import { registrar, login } from './auth.service'

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/registrar
  fastify.post('/registrar', async (req, reply) => {
    const { email, password, nombre } = req.body as any
    const result = await registrar(fastify.prisma, { email, password, nombre })
    return reply.code(201).send(result)
  })

  // POST /api/auth/login
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body as any
    const result = await login(fastify.prisma, fastify.jwt, { email, password })
    return reply.send(result)
  })
}
