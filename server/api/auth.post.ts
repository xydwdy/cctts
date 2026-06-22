import { COOKIE_NAME, createToken, checkBlock, recordFailedAttempt, clearAttempts, getCookieOptions } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const password = body?.password || ''

  // Get existing attempts cookie
  const cookieValue = getCookie(event, COOKIE_NAME)

  // Check if blocked
  const blockStatus = checkBlock(cookieValue)
  if (blockStatus.blocked) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `密码错误次数过多，请 ${Math.ceil(blockStatus.remaining / 60)} 分钟后重试`,
    })
  }

  // Attempt to create token
  const token = createToken(password)

  if (token === null) {
    // Wrong password - record attempt
    const result = recordFailedAttempt(cookieValue)

    // Set the updated cookie (always, even if already blocked — to keep expiry updated)
    const opts = getCookieOptions()
    setCookie(event, COOKIE_NAME, result.newCookie, opts)

    if (result.blocked) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: `密码错误次数过多，已临时封锁，请 3 分钟后重试`,
      })
    }

    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: `密码错误`,
    })
  }

  // Success - clear attempts cookie
  const { newCookie } = clearAttempts()
  const opts = getCookieOptions()
  setCookie(event, COOKIE_NAME, newCookie, { ...opts, maxAge: 0 })

  return { success: true, token }
})