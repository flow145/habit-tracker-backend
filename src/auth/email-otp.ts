import { createHmac } from 'node:crypto'
import type { EmailOTPOptions } from 'better-auth/plugins/email-otp'
import { Resend } from 'resend'

import { env, isDevEnv, isTestEnv } from '#/config/env.ts'
import { logger } from '#/config/logger.ts'

type SendVerificationOTP = EmailOTPOptions['sendVerificationOTP']
type OTPType = Parameters<SendVerificationOTP>[0]['type']

const otpEmailCopy: Record<OTPType, { subject: string; instruction: string }> = {
  'sign-in': {
    subject: 'Your Habit Tracker sign-in code',
    instruction: 'Use this code to sign in to Habit Tracker:',
  },
  'email-verification': {
    subject: 'Verify your Habit Tracker email',
    instruction: 'Use this code to verify your email address:',
  },
  'forget-password': {
    subject: 'Your Habit Tracker password reset code',
    instruction: 'Use this code to reset your password:',
  },
  'change-email': {
    subject: 'Your Habit Tracker email change code',
    instruction: 'Use this code to confirm your email address change:',
  },
}

const buildEmailBody = (instruction: string, otp: string) =>
  `${instruction}\n\n${otp}\n\nIf you did not request this code, you can ignore this email.`

const resend = new Resend(env.RESEND_API_KEY)

export const sendVerificationOTP: SendVerificationOTP = async ({ email, otp, type }) => {
  if (isDevEnv() || isTestEnv()) {
    logger.info({ email, otp, type }, 'Authentication OTP generated')
    return
  }

  const { subject, instruction } = otpEmailCopy[type]

  const idempotencyKey = createHmac('sha256', env.BETTER_AUTH_SECRET)
    .update(JSON.stringify([email, type, otp]))
    .digest('hex')

  const { data, error } = await resend.emails.send(
    {
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject,
      text: buildEmailBody(instruction, otp),
    },
    { idempotencyKey },
  )

  if (error) {
    logger.error(
      { resendError: { name: error.name, statusCode: error.statusCode }, type },
      'Failed to send authentication OTP email',
    )
    throw error
  }

  logger.info({ emailId: data.id, type }, 'Authentication OTP email sent successfully')
}
