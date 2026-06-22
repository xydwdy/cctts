// Direct /tts endpoint matching xmtts path convention
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const text = (query.text as string) || ''
  const voice = (query.voice as string) || '白桦'
  const pauseMs = parseInt((query.pause_ms as string) || '800')
  const apiKey = (query.api_key as string) || ''

  console.log('[TTS-DIRECT] Request received')
  console.log('[TTS-DIRECT] URL received')
  console.log('[TTS-DIRECT] Params - text.length:', text.length, 'voice:', voice, 'pause_ms:', pauseMs, 'apiKey:', apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING')

  if (!text.trim()) {
    throw createError({ statusCode: 400, message: 'text parameter is required' })
  }
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'API Key is required' })
  }

  const maxLength = 500
  const truncatedText = text.length > maxLength ? text.slice(0, maxLength) + '…' : text

  try {
    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-tts',
        messages: [{ role: 'assistant', content: truncatedText }],
        audio: { format: 'wav', voice: voice },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[TTS-DIRECT] MiMo API error:', response.status, errorBody)
      throw createError({ statusCode: 502, message: `MiMo API error: ${response.status}` })
    }

    const data: any = await response.json()
    const audioBase64 = data.choices?.[0]?.message?.audio?.data
    if (!audioBase64) {
      throw createError({ statusCode: 502, message: 'No audio data from MiMo' })
    }

    let audioBuffer = Buffer.from(audioBase64, 'base64')

    // Add silence padding at the end for pause between sentences
    if (pauseMs > 0) {
      const sampleRate = 24000
      const silenceSamples = Math.floor(sampleRate * (pauseMs / 1000))
      const silenceBuffer = Buffer.alloc(silenceSamples * 2)
      audioBuffer = Buffer.concat([audioBuffer, silenceBuffer])
      // Update WAV header: RIFF total size (offset 4) and data chunk size (offset 40)
      audioBuffer.writeUInt32LE(audioBuffer.length - 8, 4)
      audioBuffer.writeUInt32LE(audioBuffer.length - 44, 40)
      console.log('[TTS-DIRECT] Added silence:', pauseMs, 'ms, new size:', audioBuffer.length, 'bytes')
    }

    setHeader(event, 'Content-Type', 'audio/wav')
    setHeader(event, 'Content-Length', audioBuffer.length)
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    return audioBuffer
  } catch (error: any) {
    console.error('[TTS-DIRECT] Error:', error.message || error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'TTS synthesis failed' })
  }
})