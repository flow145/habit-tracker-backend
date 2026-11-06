import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins/email-otp'

import { env } from '#/config/env.ts'
import { db } from '#/db/connection.ts'

import { sendVerificationOTP } from './email-otp.ts'

export const auth = betterAuth({
  appName: 'Habit Tracker',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: db,
  trustedOrigins: env.CORS_ORIGINS,
  plugins: [emailOTP({ sendVerificationOTP })],
  user: {
    deleteUser: {
      enabled: true,
    },
  },
})
