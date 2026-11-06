import { toNodeHandler } from 'better-auth/node'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { auth } from '#/auth/auth.ts'
import { env } from '#/config/env.ts'
import { httpLogger, logger } from '#/config/logger.ts'
import { healthRouter } from '#/health/health.ts'

export const createApp = (authHandler: RequestHandler = toNodeHandler(auth)) => {
  const app = express()

  app.use(cookieParser())
  app.use(helmet())
  app.use(compression())
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      logger: {
        warn: logger.warn,
        error: logger.error,
      },
    }),
  )
  app.use(httpLogger)

  app.all('/api/auth/*splat', authHandler)

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(healthRouter)

  return app
}

export const app = createApp()
