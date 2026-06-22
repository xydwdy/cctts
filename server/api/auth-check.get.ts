import { AUTH_COOKIE_NAME, isTokenValid } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const envPassword = process.env.ACCESS_PASSWORD || ''

  // No password configured -> always valid
  if (!envPassword) {
    return { valid: true }
  }

  // Only use Cookie for token (query param removed to prevent URL-based token leakage)
  const token = getCookie(event, AUTH_COOKIE_NAME) || ''

  const valid = isTokenValid(token)

  return { valid }
})