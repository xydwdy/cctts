import { AUTH_COOKIE_NAME } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const envPassword = process.env.ACCESS_PASSWORD || ''

  // No password configured -> always valid
  if (!envPassword) {
    return { valid: true }
  }

  // Try cookie first (Vercel multi-instance safe), then query param (backward compat)
  const cookieToken = getCookie(event, AUTH_COOKIE_NAME) || ''
  const queryToken = (getQuery(event).token as string) || ''
  const token = cookieToken || queryToken

  const valid = isTokenValid(token)

  return { valid }
})