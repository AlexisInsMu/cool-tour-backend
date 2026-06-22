# 🔧 Cool Tour — Fix: `src/app.ts` (faltaba registrar locatarios)

> **Causa del 404:** `locatariosRoutes` nunca se importó ni se registró en `app.ts`. Fastify no puede enrutar a un módulo que no conoce.

---

## El archivo corregido — `src/app.ts`

```typescript
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
```

### Por qué `locatariosRoutes` va en el grupo de "rutas públicas"

Aunque el comentario en tu archivo dice "Rutas protegidas (requieren JWT)" para el segundo grupo, eso es un poco engañoso — el `prefix` no aplica JWT automáticamente a todo el módulo. Cada módulo decide individualmente qué endpoints llevan `{ onRequest: [fastify.authenticate] }` y cuáles no. `locatariosRoutes` no tiene ningún endpoint protegido todavía (registro y listado son públicos por diseño de esta fase), así que lo puse junto a `poisRoutes`, que tiene la misma característica.

---

## Después de pegar esto

```bash
npm run dev
```

Si usabas `tsx watch`, debería recargar solo. Si no ves el mensaje de reinicio en la consola, detén el proceso (`Ctrl+C`) y vuelve a correr `npm run dev`.

Prueba de nuevo:

```bash
curl -X POST http://localhost:3000/api/locatarios/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Café Central",
    "email": "cafecentral@negocio.com",
    "password": "negocio1234",
    "negocio": "Cafetería"
  }'
```

Ahora debería darte `201` con el locatario creado (sin `passwordHash` en la respuesta).

---

## 📋 Checklist

```
□ app.ts actualizado con el import y el register de locatariosRoutes
□ npm run dev reiniciado (o tsx watch recargó solo)
□ curl POST /api/locatarios/registrar devuelve 201
□ curl GET /api/locatarios lista el locatario creado
```
