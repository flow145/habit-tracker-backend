import { Pool } from 'pg'

import { env, isProdEnv, isStagingEnv } from '#/config/env.ts'
import { logger } from '#/config/logger.ts'

const buildConnectionString = () => {
  const url = new URL('postgresql://localhost')

  url.hostname = env.DATABASE_HOST
  url.port = String(env.DATABASE_PORT)
  url.username = env.DATABASE_USER
  url.password = env.DATABASE_PASSWORD
  url.pathname = `/${env.DATABASE_NAME}`

  return url.toString()
}

const createClient = () =>
  new Pool({
    connectionString: buildConnectionString(),
    max: env.DATABASE_POOL_MAX,
    min: env.DATABASE_POOL_MIN,
  })

const globalForDb = globalThis as typeof globalThis & {
  dbClient?: ReturnType<typeof createClient>
}

const getDevClient = () => {
  if (!globalForDb.dbClient) globalForDb.dbClient = createClient()
  return globalForDb.dbClient
}

export const db = isProdEnv() || isStagingEnv() ? createClient() : getDevClient()

export const connectDb = async () => {
  await db.query('SELECT 1')
  logger.info('Database connection established')
}
