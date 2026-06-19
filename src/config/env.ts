import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  PORT: z.string().default('3000'),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Variables de entorno inválidas:', result.error.format())
  process.exit(1)
}

export const env = result.data
