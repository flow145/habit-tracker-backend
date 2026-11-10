import { randomBytes } from 'node:crypto'
import { env as loadEnv } from 'custom-env'
import { z } from 'zod'

process.env.APP_STAGE = process.env.APP_STAGE || 'dev'

const isDevelopment = process.env.APP_STAGE === 'dev'
const isTesting = process.env.APP_STAGE === 'test'
const isStaging = process.env.APP_STAGE === 'staging'
const isProduction = process.env.APP_STAGE === 'prod'

const genSecret = () => randomBytes(32).toString('base64url')

if (isDevelopment) loadEnv('development')
if (isTesting) loadEnv('test')

const httpUrlOrLocalhost = z.union([
  z.httpUrl(),
  z.url({ protocol: /^https?$/, hostname: /^localhost$/ }),
])

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
    .pipe(z.array(httpUrlOrLocalhost)),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60 * 60 * 1000)
    .default(10 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).max(10_000).default(100),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default(isDevelopment ? 'debug' : 'info'),

  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_HOST: z
    .string()
    .trim()
    .min(1)
    .default(isDevelopment || isTesting ? 'localhost' : ''),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_NAME: z.string().min(1),
  DATABASE_POOL_MIN: z.coerce.number().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().positive().max(50).default(10),

  BETTER_AUTH_SECRET: isTesting ? z.string().min(32).default(genSecret()) : z.string().min(32),
  BETTER_AUTH_URL: isTesting
    ? httpUrlOrLocalhost.default('http://localhost:3000')
    : httpUrlOrLocalhost,

  RESEND_API_KEY:
    isStaging || isProduction ? z.string().trim().min(1) : z.string().default('not-configured'),
  RESEND_FROM_EMAIL: isProduction
    ? z.string().trim().min(1)
    : z.string().default('Habit Tracker <onboarding@resend.dev>'),
})

export type Env = z.infer<typeof envSchema>

export let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:')

    error.issues.forEach(({ path, message, code, input }) => {
      const key = path.join('.')
      const safeInput =
        input !== undefined && /(?:SECRET|API_KEY|TOKEN|PASSWORD)/i.test(key) ? '[REDACTED]' : input
      console.log(`${key}: ${message}, code: ${code}, input: ${safeInput}`)
    })

    process.exit(1)
  }

  throw error
}

export const isProdEnv = () => env.APP_STAGE === 'prod'
export const isDevEnv = () => env.APP_STAGE === 'dev'
export const isTestEnv = () => env.APP_STAGE === 'test'
export const isStagingEnv = () => env.APP_STAGE === 'staging'
