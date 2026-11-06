import { randomUUID } from 'node:crypto'
import { toNodeHandler } from 'better-auth/node'
import request from 'supertest'

import { createApp } from '#/app.ts'

import { authTest, testAuth } from './utils.ts'

const app = createApp(toNodeHandler(testAuth))
type AuthClient = ReturnType<typeof request.agent>

let userIds: Set<string>

const createEmail = () => `auth-${randomUUID()}@example.com`

const requestSignInOTP = async (client: AuthClient, email: string) => {
  await client
    .post('/api/auth/email-otp/send-verification-otp')
    .send({ email, type: 'sign-in' })
    .expect(200)

  const otp = authTest.getOTP?.(email)

  if (!otp) {
    throw new Error(`Better Auth did not capture an OTP for ${email}`)
  }

  return otp
}

const signInWithEmailOTP = async (client: AuthClient, email: string) => {
  const otp = await requestSignInOTP(client, email)
  const response = await client.post('/api/auth/sign-in/email-otp').send({ email, otp }).expect(200)

  if (typeof response.body.user?.id === 'string') {
    userIds.add(response.body.user.id)
  }

  return response
}

const trackUser = (userId: string) => userIds.add(userId)

describe('Authentication routes', () => {
  beforeEach(() => {
    userIds = new Set()
    authTest.clearOTPs?.()
  })

  afterEach(async () => {
    await Promise.all([...userIds].map((userId) => authTest.deleteUser(userId)))
  })

  it('creates a User and starts a session after a valid email OTP', async () => {
    const client = request.agent(app)
    const email = createEmail()
    const response = await signInWithEmailOTP(client, email)
    const userId = response.body.user.id

    expect(response.body.user).toMatchObject({ email, emailVerified: true })
    expect(response.headers['set-cookie']).toBeDefined()

    const sessionResponse = await client.get('/api/auth/get-session').expect(200)

    expect(sessionResponse.body).toMatchObject({
      user: { id: userId, email },
    })
  })

  it('signs an existing User in without creating a duplicate', async () => {
    const client = request.agent(app)
    const email = createEmail()
    const firstSignIn = await signInWithEmailOTP(client, email)
    const secondSignIn = await signInWithEmailOTP(client, email)

    expect(secondSignIn.body.user.id).toBe(firstSignIn.body.user.id)

    const sessionResponse = await client.get('/api/auth/get-session').expect(200)

    expect(sessionResponse.body.user.id).toBe(firstSignIn.body.user.id)
  })

  it('does not create an authenticated session for an invalid OTP', async () => {
    const client = request.agent(app)
    const email = createEmail()
    const otp = await requestSignInOTP(client, email)
    const invalidOTP = otp === '000000' ? '000001' : '000000'

    await client
      .post('/api/auth/sign-in/email-otp')
      .send({ email, otp: invalidOTP })
      .expect((response) => {
        expect(response.status).toBeGreaterThanOrEqual(400)
      })

    const sessionResponse = await client.get('/api/auth/get-session').expect(200)

    expect(sessionResponse.body).toBeNull()
  })

  it('invalidates a User session after sign-out', async () => {
    const client = request.agent(app)
    const email = createEmail()

    await signInWithEmailOTP(client, email)
    await client.post('/api/auth/sign-out').send({}).expect(200)

    const sessionResponse = await client.get('/api/auth/get-session').expect(200)

    expect(sessionResponse.body).toBeNull()
  })

  it('requires an authenticated session to delete a User', async () => {
    const client = request.agent(app)

    await client
      .post('/api/auth/delete-user')
      .send({})
      .expect((response) => {
        expect(response.status).toBeGreaterThanOrEqual(400)
      })

    const sessionResponse = await client.get('/api/auth/get-session').expect(200)

    expect(sessionResponse.body).toBeNull()
  })

  it('deletes only the signed-in User and invalidates their session', async () => {
    const ownerClient = request.agent(app)
    const ownerEmail = createEmail()
    const ownerSignIn = await signInWithEmailOTP(ownerClient, ownerEmail)
    const ownerId = ownerSignIn.body.user.id

    const otherUser = authTest.createUser({ email: createEmail() })
    await authTest.saveUser(otherUser)
    trackUser(otherUser.id)

    const otherUserHeaders = await authTest.getAuthHeaders({ userId: otherUser.id })
    const otherUserCookie = otherUserHeaders.get('cookie')

    if (!otherUserCookie) {
      throw new Error('Better Auth did not create a session cookie for the other User')
    }

    const deletionResponse = await ownerClient.post('/api/auth/delete-user').send({}).expect(200)

    expect(deletionResponse.body).toMatchObject({ success: true, message: 'User deleted' })

    const deletedSessionResponse = await ownerClient.get('/api/auth/get-session').expect(200)
    expect(deletedSessionResponse.body).toBeNull()

    const otherSessionResponse = await request(app)
      .get('/api/auth/get-session')
      .set('Cookie', otherUserCookie)
      .expect(200)

    expect(otherSessionResponse.body.user).toMatchObject({
      id: otherUser.id,
      email: otherUser.email,
    })

    const recreatedUserSignIn = await signInWithEmailOTP(request.agent(app), ownerEmail)

    expect(recreatedUserSignIn.body.user.id).not.toBe(ownerId)
  })
})
