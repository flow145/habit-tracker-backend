import type { Request, Response } from 'express'
import { pino, stdSerializers } from 'pino'
import { pinoHttp } from 'pino-http'

import { env, isDevEnv } from '#/config/env.ts'

export const logger = pino({
  level: env.LOG_LEVEL,

  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'apiKey',
      'secret',
    ],
    censor: '[REDACTED]',
  },

  transport: isDevEnv()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false,
        },
      }
    : undefined,
})

const isDebugOrTraceLogLevel = env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'trace'

const infoReqSerializer = (req: Request) => ({ id: req.id, method: req.method, url: req.url })
const infoResSerializer = (res: Response) => ({ status: res.statusCode })

export const httpLogger = pinoHttp({
  logger,

  serializers: {
    err: stdSerializers.err,
    req: isDebugOrTraceLogLevel ? stdSerializers.req : infoReqSerializer,
    res: isDebugOrTraceLogLevel ? stdSerializers.res : infoResSerializer,
  },

  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
})
