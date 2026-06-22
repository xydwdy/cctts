export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const text = (query.text as string) || ''
  const voice = (query.voice as string) || '白桦'
  const pauseMs = parseInt((query.pause_ms as string) || '800')
  const apiKey = (query.api_key as string) || ''

  // Log incoming request for debugging
  console.log('[TTS] Request received')
  console.log('[TTS] Params - text.length:', text.length, 'voice:', voice, 'pause_ms:', pauseMs, 'apiKey:', apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING')
  console.log('[TTS] apiKey provided:', !!apiKey)

  // Validate text
  if (!text.trim()) {
    console.error('[TTS] Error: text is empty')
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'text parameter is required',
    })
  }

  if (!apiKey) {
    console.error('[TTS] Error: apiKey is missing')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'API Key is required: provide via query parameter api_key',
    })
  }

  // Truncate long text to prevent Vercel timeout
  const maxLength = 500
  const truncatedText = text.length > maxLength ? text.slice(0, maxLength) + '…' : text

  try {
    console.log('[TTS] Calling MiMo API...')
    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-tts',
        messages: [
          {
            role: 'assistant',
            content: truncatedText,
          },
        ],
        audio: {
          format: 'wav',
          voice: voice,
        },
      }),
    })

    console.log('[TTS] MiMo API response status:', response.status)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[TTS] MiMo API error:', response.status, errorBody)
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: `MiMo API error: ${response.status} - ${errorBody.slice(0, 200)}`,
      })
    }

    const data: any = await response.json()
    console.log('[TTS] MiMo API response has audio:', !!data.choices?.[0]?.message?.audio?.data)
    const audioBase64 = data.choices?.[0]?.message?.audio?.data

    if (!audioBase64) {
      console.error('[TTS] Error: MiMo returned no audio data')
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: 'MiMo API returned no audio data',
      })
    }

    // Decode base64 to buffer
    let audioBuffer = Buffer.from(audioBase64, 'base64')

    // Add silence padding at the end for pause between sentences
    if (pauseMs > 0) {
      // WAV format: 16-bit mono, sample rate determined by MiMo (typically 24000Hz)
      const sampleRate = 24000
      const silenceSamples = Math.floor(sampleRate * (pauseMs / 1000))
      const silenceBuffer = Buffer.alloc(silenceSamples * 2) // 16-bit = 2 bytes per sample
      audioBuffer = Buffer.concat([audioBuffer, silenceBuffer])
      // Update WAV header: RIFF total size (offset 4) and data chunk size (offset 40)
      audioBuffer.writeUInt32LE(audioBuffer.length - 8, 4)
      audioBuffer.writeUInt32LE(audioBuffer.length - 44, 40)
      console.log('[TTS] Added silence:', pauseMs, 'ms, new size:', audioBuffer.length, 'bytes')
    }

    // Return audio with correct content type
    setHeader(event, 'Content-Type', 'audio/wav')
    setHeader(event, 'Content-Length', audioBuffer.length)
    return audioBuffer
  } catch (error: any) {
    console.error('[TTS] Error:', error.message || error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Unknown error during TTS synthesis',
    })
  }
})
