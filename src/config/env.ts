import { env as loadEnv } from 'custom-env'
import { z } from 'zod'

process.env.APP_STAGE = process.env.APP_STAGE || 'dev'

const isDevelopment = process.env.APP_STAGE === 'dev'
const isTesting = process.env.APP_STAGE === 'test'

if (isDevelopment) loadEnv('development')
if (isTesting) loadEnv('test')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_STAGE: z.enum(['dev', 'prod', 'test', 'staging']).default('dev'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(
      z.array(z.union([z.httpUrl(), z.url({ protocol: /^https?$/, hostname: /^localhost$/ })])),
    ),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60 * 60 * 1000)
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).max(10_000).default(100),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default(isDevelopment ? 'debug' : 'info'),

  DATABASE_URL: z
    .url()
    .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
      message: 'Must be a valid Postgres URL',
    }),
  DATABASE_POOL_MIN: z.coerce.number().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().positive().max(50).default(10),
})

export type Env = z.infer<typeof envSchema>

export let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:')

    error.issues.forEach(({ path, message, code, input }) => {
      console.log(`${path.join('.')}: ${message}, code: ${code}, input: ${input}`)
    })

    process.exit(1)
  }

  throw error
}

export const isProdEnv = () => env.APP_STAGE === 'prod'
export const isDevEnv = () => env.APP_STAGE === 'dev'
export const isTestEnv = () => env.APP_STAGE === 'test'
export const isStagingEnv = () => env.APP_STAGE === 'staging'
