import { betterAuth } from 'better-auth'
import { testUtils } from 'better-auth/plugins'

import { authOptions } from '#/auth/auth.ts'

export const testAuth = betterAuth({
  ...authOptions,
  plugins: [testUtils({ captureOTP: true }), ...authOptions.plugins],
})

export const authTest = (await testAuth.$context).test
