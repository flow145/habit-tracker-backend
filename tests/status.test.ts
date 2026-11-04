import request from 'supertest'

import { app } from '#/app.ts'

describe('Service status endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/health').expect(200)

      expect(res.body).toMatchObject({
        status: expect.stringMatching(/ok/i),
        timestamp: expect.any(String),
      })
    })
  })
})
