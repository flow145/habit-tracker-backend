import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodType } from 'zod'

export const validateBody =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body)
      req.body = validated // may be modified by zod
      next()
    } catch (error) {
      if (error instanceof ZodError)
        return res.status(422).json({
          error: 'Validation failed',
          details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
        })

      next(error)
    }
  }

export const validateParams =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof ZodError)
        return res.status(422).json({
          error: 'Invalid params',
          details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
        })

      next(error)
    }
  }

export const validateQuery =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof ZodError)
        return res.status(422).json({
          error: 'Invalid query params',
          details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
        })

      next(error)
    }
  }
