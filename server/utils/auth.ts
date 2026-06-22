import { randomBytes, createHmac } from 'crypto'

// Rate limiting constants
const MAX_ATTEMPTS = 3
const BLOCK_MINUTES = 3

// Cookie config
export const COOKIE_NAME = 'cctts_auth_attempts'
export const AUTH_COOKIE_NAME = 'cctts_auth_token'
const HMAC_SECRET = process.env.COOKIE_SECRET || process.env.ACCESS_PASSWORD || 'cctts-default-secret'

// Token expiry: 30 days in seconds
const TOKEN_MAX_AGE = 30 * 24 * 60 * 60

// ── Token functions (cookie-based, works on Vercel multi-instance) ──

export function createToken(password: string): string | null {
  const envPassword = process.env.ACCESS_PASSWORD || ''
  if (!envPassword) return ''  // No password configured
  if (password !== envPassword) return null
  // Generate a signed cookie value: base64({t: token, e: expiry}).hmac
  const payload = Buffer.from(JSON.stringify({ t: randomBytes(32).toString('hex'), e: Date.now() + TOKEN_MAX_AGE * 1000 })).toString('base64')
  return signPayload(payload)
}

export function isTokenValid(token: string): boolean {
  const envPassword = process.env.ACCESS_PASSWORD || ''
  if (!envPassword) return true
  if (!token) return false
  const payload = token.slice(0, token.lastIndexOf('.'))
  const signature = token.slice(token.lastIndexOf('.') + 1)
  const expectedSig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
  if (signature !== expectedSig) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    if (typeof data.t === 'string' && typeof data.e === 'number' && Date.now() < data.e) return true
  } catch {}
  return false
}

// ── Cookie payload helpers ──
// Payload format: JSON with { c: count, b: blockedUntil }
// Cookie value format: base64(payload).hmac_hex_signature

function signPayload(payload: string): string {
  const hmac = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
  return `${payload}.${hmac}`
}

function parseCookieValue(cookieValue: string | undefined): { count: number; blockedUntil: number } | null {
  if (!cookieValue) return null

  const lastDot = cookieValue.lastIndexOf('.')
  if (lastDot === -1) return null

  const payload = cookieValue.slice(0, lastDot)
  const signature = cookieValue.slice(lastDot + 1)

  // Verify HMAC signature (prevents client tampering)
  const expectedSig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
  if (signature !== expectedSig) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    if (typeof data.c === 'number' && typeof data.b === 'number') {
      return { count: data.c, blockedUntil: data.b }
    }
  } catch {
    // Malformed payload
  }

  return null
}

function createCookieValue(count: number, blockedUntil: number): string {
  const payload = Buffer.from(JSON.stringify({ c: count, b: blockedUntil })).toString('base64')
  return signPayload(payload)
}

// ── Public API ──

/**
 * Check if the client (identified by their signed cookie) is currently blocked.
 * This is a read-only check, does NOT modify any state.
 */
export function checkBlock(cookieValue: string | undefined): { blocked: boolean; remaining: number } {
  const data = parseCookieValue(cookieValue)
  if (!data) return { blocked: false, remaining: 0 }

  const now = Date.now()
  if (data.blockedUntil > 0 && now < data.blockedUntil) {
    const remaining = Math.ceil((data.blockedUntil - now) / 1000)
    return { blocked: true, remaining }
  }

  // Block expired — treat as not blocked (new cookie will be issued on next attempt)
  return { blocked: false, remaining: 0 }
}

/**
 * Record a failed login attempt. Returns the new cookie value to set.
 */
export function recordFailedAttempt(cookieValue: string | undefined): {
  blocked: boolean
  remaining: number
  newCookie: string
} {
  const data = parseCookieValue(cookieValue)

  const count = data ? data.count + 1 : 1
  const now = Date.now()

  if (count >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_MINUTES * 60 * 1000
    const remaining = Math.ceil((blockedUntil - now) / 1000)
    return {
      blocked: true,
      remaining,
      newCookie: createCookieValue(count, blockedUntil),
    }
  }

  return {
    blocked: false,
    remaining: 0,
    newCookie: createCookieValue(count, 0),
  }
}

/**
 * Clear attempts on successful login. Returns an empty string to signal cookie deletion.
 */
export function clearAttempts(): { newCookie: string } {
  return { newCookie: '' }
}

/**
 * Get the failed count from a cookie value (used for displaying attempt info).
 */
export function getFailedCount(cookieValue: string | undefined): number {
  const data = parseCookieValue(cookieValue)
  return data ? data.count : 0
}

/**
 * Get cookie options for setCookie (security defaults).
 */
export function getCookieOptions(): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax'
  path: string
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  }
}