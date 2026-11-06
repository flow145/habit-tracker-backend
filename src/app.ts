import { toNodeHandler } from 'better-auth/node'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'

import { auth } from '#/auth/auth.ts'
import { env } from '#/config/env.ts'
import { httpLogger, logger } from '#/config/logger.ts'

export const app = express()

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

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    status: ReasonPhrases.OK,
    timestamp: new Date().toISOString(),
  })
})
