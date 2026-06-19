import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

export async function registrar(prisma: PrismaClient, data: {
  email: string, password: string, nombre: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  const usuario = await prisma.usuario.create({
    data: { email: data.email, passwordHash, nombre: data.nombre,
            perfil: { create: {} } },
    select: { id: true, email: true, nombre: true }
  })
  return usuario
}

export async function login(prisma: PrismaClient, jwt: any, data: {
  email: string, password: string
}) {
  const usuario = await prisma.usuario.findUnique({ where: { email: data.email } })
  if (!usuario) throw { statusCode: 401, message: 'Credenciales inválidas' }

  const valido = await bcrypt.compare(data.password, usuario.passwordHash)
  if (!valido) throw { statusCode: 401, message: 'Credenciales inválidas' }

  const token = jwt.sign({ sub: usuario.id, email: usuario.email })
  return { token, usuario: { id: usuario.id, nombre: usuario.nombre } }
}
