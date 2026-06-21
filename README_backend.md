# 🛠️ Cool Tour — Backend

API REST para la app de turismo **Cool Tour**, construida con Fastify, Prisma y PostgreSQL.

---

## 📦 Stack

| Tecnología | Uso |
|---|---|
| [Fastify 4](https://fastify.dev) | Servidor HTTP |
| [Prisma 5](https://prisma.io) | ORM hacia PostgreSQL |
| PostgreSQL 16 | Base de datos |
| [Zod](https://zod.dev) | Validación de schemas |
| `@fastify/jwt` | Autenticación con tokens JWT |
| `bcrypt` | Hash de contraseñas |
| TypeScript + `tsx` | Lenguaje y hot-reload en desarrollo |

---

## 📁 Estructura esperada

```
cool-tour-backend/
├── src/
│   ├── index.ts          # Punto de entrada — levanta Fastify
│   ├── app.ts             # Registro de rutas y plugins
│   └── plugins/
│       └── prisma.ts      # Cliente de Prisma como plugin de Fastify
├── prisma/
│   └── schema.prisma      # Modelos de la base de datos
├── docker-compose.yml      # Servicios: api + db (PostgreSQL)
├── Dockerfile
├── .env                    # Variables de entorno (no se sube a git)
├── package.json
└── tsconfig.json
```

---

## ⚙️ Requisitos previos

- Node.js 20+
- Docker y Docker Compose
- `npm`

---

## 🚀 Setup inicial

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cooltour"
JWT_SECRET="tu_secreto_seguro_aqui"
```

### 3. Levantar solo la base de datos en Docker

```bash
docker compose up -d db
```

> ⚠️ Asegúrate que el servicio `db` en `docker-compose.yml` tenga `ports: ["5432:5432"]` mapeado, o `localhost:5432` no será accesible desde fuera del contenedor.

### 4. Aplicar migraciones de Prisma

```bash
npm run db:migrate
```

### 5. Levantar el servidor en modo desarrollo (hot-reload)

```bash
npm run dev
```

El servidor queda escuchando en `http://0.0.0.0:3000` — accesible desde:
- Tu propia laptop: `http://localhost:3000`
- Otros dispositivos en tu red (ej. tu celular probando la app Android): `http://TU_IP_LOCAL:3000`

Para encontrar tu IP local:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor con hot-reload (`tsx watch`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run start` | Corre la versión compilada (`dist/index.js`) — usar en producción |
| `npm run db:migrate` | Crea y aplica una nueva migración de Prisma |
| `npm run db:push` | Sincroniza el schema sin generar migración (solo prototipado) |
| `npm run db:studio` | Abre Prisma Studio en `http://localhost:5555` — explorador visual de la DB |

---

## 🐳 Docker — manejo diario

### Apagar la base de datos (sin perder datos)
```bash
docker compose stop db
```

### Volver a prenderla
```bash
docker compose up -d db
```

### Ver contenedores activos
```bash
docker ps
```

### ⚠️ NUNCA uses esto a menos que quieras borrar todo
```bash
docker compose down -v   # -v elimina el volumen = pierdes todos los datos
```

---

## 🌱 Cargar datos de prueba

Ver `seed_datos_cool_tour.md` — incluye comandos `curl` para crear usuarios, POIs, rutas y cupones de ejemplo (Centro Histórico CDMX).

Verificación rápida:
```bash
curl http://localhost:3000/api/pois
```

---

## 📡 Documentación de la API

Ver `endpoints_cool_tour.md` para el detalle completo de cada endpoint, bodies esperados, respuestas y códigos de error.

Resumen de recursos:

| Recurso | Base path |
|---|---|
| Auth | `/api/auth` |
| POIs | `/api/pois` |
| Rutas | `/api/rutas` |
| Cupones | `/api/cupones` |
| Logros *(pendiente)* | `/api/logros` |
| Misiones *(pendiente)* | `/api/misiones` |
| Reseñas *(pendiente)* | `/api/resenas` |
| Locatarios *(pendiente)* | `/api/locatarios` |

---

## 🔐 Autenticación

Las rutas protegidas requieren header:
```
Authorization: Bearer <token>
```

El token se obtiene en `POST /api/auth/login` y expira según la configuración de `@fastify/jwt`.

---

## 🧪 Troubleshooting común

| Problema | Causa probable | Solución |
|---|---|---|
| `Can't reach database server at localhost:5432` | Postgres no está corriendo o no tiene el puerto mapeado | `docker compose up -d db` y verifica `ports:` en el compose |
| Conflicto entre dos contenedores Postgres | Creaste uno con `docker run` y otro con `docker compose` | `docker stop` + `docker rm` del que sobra, deja solo uno |
| El celular no puede llegar a la API | Backend escuchando solo en `127.0.0.1` | Confirma que `index.ts` use `host: '0.0.0.0'` en `server.listen()` |
| `EADDRINUSE :3000` | Ya hay otro proceso usando el puerto | `lsof -i :3000` y mata el proceso, o cambia el puerto |

---

## 🗺️ Roadmap de endpoints pendientes

- [ ] `GET /api/logros` y `/api/logros/mis-logros`
- [ ] `GET /api/misiones` y `/api/misiones/mis-misiones`
- [ ] `POST /api/resenas` y `GET /api/resenas/poi/:poiId`
- [ ] `POST /api/locatarios/registrar`, `/login`, `/plan`, `/pois`
- [ ] Endpoint de creación de cupones (`POST /api/cupones`) — actualmente solo existe `/validar`
