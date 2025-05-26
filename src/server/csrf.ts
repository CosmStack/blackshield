import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import type { CsrfConfig, CsrfToken } from '../types'

const DEFAULT_CONFIG: Required<CsrfConfig> = {
  tokenHeader: 'x-csrf-token',
  tokenCookie: 'csrf-token',
  tokenExpiry: 3600, // 1 hour
}

// Get JWT secret for CSRF tokens
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      'JWT_SECRET or NEXTAUTH_SECRET environment variable is required for CSRF protection',
    )
  }
  return new TextEncoder().encode(secret)
}

/**
 * Generate a new CSRF token
 */
export async function generateCsrfToken(config: Partial<CsrfConfig> = {}): Promise<CsrfToken> {
  const { tokenExpiry } = { ...DEFAULT_CONFIG, ...config }
  const secret = getJwtSecret()

  const expiresAt = Date.now() + tokenExpiry * 1000

  const token = await new SignJWT({
    type: 'csrf',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret)

  return { token, expiresAt }
}

/**
 * Verify a CSRF token
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)

    return (
      payload.type === 'csrf' &&
      typeof payload.exp === 'number' &&
      payload.exp > Math.floor(Date.now() / 1000)
    )
  } catch {
    return false
  }
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfTokenCookie(config: Partial<CsrfConfig> = {}): Promise<string> {
  const { tokenCookie } = { ...DEFAULT_CONFIG, ...config }
  const { token } = await generateCsrfToken(config)

  const cookieStore = await cookies()
  cookieStore.set(tokenCookie, token, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: config.tokenExpiry || DEFAULT_CONFIG.tokenExpiry,
  })

  return token
}

/**
 * Get CSRF token from request
 */
export function getCsrfTokenFromRequest(
  req: NextRequest,
  config: Partial<CsrfConfig> = {},
): string | null {
  const { tokenHeader, tokenCookie } = { ...DEFAULT_CONFIG, ...config }

  // Try header first
  const headerToken = req.headers.get(tokenHeader)
  if (headerToken) return headerToken

  // Try cookie
  const cookieToken = req.cookies.get(tokenCookie)?.value
  if (cookieToken) return cookieToken

  // Try body for form submissions
  if (
    req.method === 'POST' &&
    req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')
  ) {
    // Note: This would require reading the body, which is handled in middleware
    return null
  }

  return null
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(
  req: NextRequest,
  config: Partial<CsrfConfig> = {},
): Promise<boolean> {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true
  }

  const token = getCsrfTokenFromRequest(req, config)
  if (!token) return false

  return await verifyCsrfToken(token)
}

/**
 * CSRF middleware for API routes
 */
export function csrfMiddleware(config: Partial<CsrfConfig> = {}) {
  return async (req: NextRequest): Promise<Response | null> => {
    const isValid = await validateCsrfToken(req, config)

    if (!isValid) {
      return Response.json({ error: 'Invalid or missing CSRF token' }, { status: 403 })
    }

    return null // Continue to next middleware/handler
  }
}
