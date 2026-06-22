export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = (query.token as string) || ''

  const envPassword = process.env.ACCESS_PASSWORD || ''

  // No password configured -> always valid
  if (!envPassword) {
    return { valid: true }
  }

  const valid = isTokenValid(token)

  return { valid }
})
