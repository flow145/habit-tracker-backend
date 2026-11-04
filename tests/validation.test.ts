import type { Request, Response } from 'express'
import { z } from 'zod'
import { validateBody, validateParams, validateQuery } from '../src/middleware/validation.ts'

const createRes = () =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  }) as unknown as Response

describe('Request body validation middleware', () => {
  it('should call next and add req.body if valid', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      id: z.coerce.number().int(),
      isVerified: z.boolean(),
      note: z.string().optional(),
    })

    const req = {
      body: { name: 'John', age: 30, id: '123', isVerified: true, note: undefined },
    } as Request
    const res = createRes()
    const next = vi.fn()

    validateBody(schema)(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(req.body).toEqual({ name: 'John', age: 30, id: 123, isVerified: true })
  })

  it('should return 422 status and error message if invalid', () => {
    const schema = z.object({
      name: z.string(),
      details: z.object({ age: z.number() }),
    })

    const req = {
      body: { name: 'John', details: { age: 'thirty' } },
    } as Request
    const res = createRes()
    const next = vi.fn()

    validateBody(schema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: [{ field: 'details.age', message: expect.stringMatching(/invalid/i) }],
    })
  })
})

describe('Request params validation middleware', () => {
  it('should call next if valid', () => {
    const schema = z.object({ id: z.coerce.number().int() })

    const req = { params: { id: '123' } } as Request<{ id: string }>
    const res = createRes()
    const next = vi.fn()

    validateParams(schema)(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('should return 422 status and error message if invalid', () => {
    const schema = z.object({ id: z.coerce.number().int() })

    const req = { params: { id: 'abc' } } as Request<{ id: string }>
    const res = createRes()
    const next = vi.fn()

    validateParams(schema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid params',
      details: [{ field: 'id', message: expect.stringMatching(/invalid/i) }],
    })
  })
})

describe('Request query validation middleware', () => {
  it('should call next if valid', () => {
    const schema = z.object({
      filter: z.string(),
      sort: z.enum(['asc', 'desc']),
    })

    const req = { query: { filter: 'term', sort: 'desc' } } as Request<
      Record<string, never>,
      unknown,
      unknown,
      { filter: string; sort: string }
    >
    const res = createRes()
    const next = vi.fn()

    validateQuery(schema)(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('should return 422 status and error message if invalid', () => {
    const schema = z.object({
      filter: z.string(),
      sort: z.enum(['asc', 'desc']),
    })

    const req = { query: { filter: 'term', sort: '123' } } as Request<
      Record<string, never>,
      unknown,
      unknown,
      { filter: string; sort: string }
    >
    const res = createRes()
    const next = vi.fn()

    validateQuery(schema)(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid query params',
      details: [{ field: 'sort', message: expect.stringMatching(/invalid/i) }],
    })
  })
})
