import { createHmac, timingSafeEqual } from 'node:crypto'

const OTP_SECRET_SALT = process.env.OTP_SECRET_SALT || 'dev-salt-change-this-in-prod'

export function hashOTP(otp: string): string {
  return createHmac('sha256', OTP_SECRET_SALT)
    .update(otp)
    .digest('hex')
}

export function compareOTP(userOtp: string, storedHash: string): boolean {
  const userHash = hashOTP(userOtp)
  return timingSafeEqual(
    Buffer.from(userHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  )
}
