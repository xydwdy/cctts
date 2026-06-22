export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const voice = (query.voice as string) || '白桦'
  const pauseMs = (query.pause_ms as string) || '500'
  const userApiKey = (query.api_key as string) || ''
  const envApiKey = process.env.MIMO_API_KEY || ''
  const apiKey = userApiKey || envApiKey

  // Build the TTS API base URL from the current request
  const host = getRequestHeader(event, 'host') || 'localhost:3000'
  // Use x-forwarded-proto if behind proxy (Vercel), otherwise default to http for dev
  const protocol = getRequestHeader(event, 'x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  // Build the complete TTS URL
  const ttsUrl = `${baseUrl}/tts?api_key=${encodeURIComponent(apiKey)}&voice=${encodeURIComponent(voice)}&pause_ms=${pauseMs}&text={{java.encodeURI(speakText)}}`

  // Legado import format - must return an array of source objects
  const source = {
    name: `CCTTS - ${voice}`,
    url: ttsUrl,
    contentType: 'audio/wav',
    id: Date.now(),
    concurrentRate: '',
    loginUrl: '',
    loginUi: '',
    loginCheckJs: '',
    header: '',
  }

  return [source]
})