export default defineEventHandler(async (event) => {
  const req = event.node?.req
  const url = req?.url || ''
  const method = req?.method || ''
  const headers = req?.headers || {}

  // Log ALL incoming requests to see what Legado is actually sending
  console.log(`[REQUEST] ${method} ${url}`)

  // Also log if there are any OPTIONS/HEAD requests (CORS preflight)
  if (method !== 'GET') {
    console.log(`[REQUEST-NON-GET] ${method} ${url}`)
    console.log(`[REQUEST-HEADERS]`, JSON.stringify(headers))
  }
})
