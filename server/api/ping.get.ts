export default defineEventHandler(async (event) => {
  return { status: 'ok', message: 'CCTTS server is running' }
})