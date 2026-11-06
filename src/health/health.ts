import { Router } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'

import { db } from '#/db/connection.ts'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    status: ReasonPhrases.OK,
    timestamp: new Date().toISOString(),
  })
})

healthRouter.get('/health/ready', async (_req, res) => {
  try {
    await db.query('SELECT 1')

    res.status(StatusCodes.OK).json({
      status: ReasonPhrases.OK,
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: ReasonPhrases.SERVICE_UNAVAILABLE,
      timestamp: new Date().toISOString(),
    })
  }
})
