import { FastifyInstance } from 'fastify'
import prismaPlugin from './plugins/prisma'
import authPlugin from './plugins/auth'
import { authRoutes } from './modules/auth/auth.routes'
import { poisRoutes } from './modules/pois/pois.routes'
import { rutasRoutes } from './modules/rutas/rutas.routes'
import { cuponesRoutes } from './modules/cupones/cupones.routes'
import { locatariosRoutes } from './modules/locatarios/locatarios.routes'   // ⭐ NUEVO

export async function app(fastify: FastifyInstance) {
  // Plugins globales
  await fastify.register(prismaPlugin)
  await fastify.register(authPlugin)

  // Rutas públicas
  fastify.register(authRoutes, { prefix: '/api/auth' })
  fastify.register(poisRoutes, { prefix: '/api/pois' })
  fastify.register(locatariosRoutes, { prefix: '/api/locatarios' })   // ⭐ NUEVO

  // Rutas protegidas (requieren JWT)
  fastify.register(rutasRoutes, { prefix: '/api/rutas' })
  fastify.register(cuponesRoutes, { prefix: '/api/cupones' })
}