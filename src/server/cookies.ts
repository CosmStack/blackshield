import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.BLACKSHIELD_SECRET || 'fallback-secret-change-in-production',
)

export interface SecureCookieOptions {
  maxAge?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
}

export async function createSignedCookie(
  name: string,
  value: unknown,
  options: SecureCookieOptions = {},
): Promise<void> {
  const {
    maxAge = 60 * 60 * 24 * 7, // 7 days
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax',
    path = '/',
  } = options

  try {
    const token = await new SignJWT({ data: value })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
      .sign(secret)

    const cookieStore = await cookies()
    cookieStore.set(name, token, {
      maxAge,
      httpOnly,
      secure,
      sameSite,
      path,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Blackshield] Failed to create signed cookie:', error)
    }
    throw new Error('Failed to create secure cookie')
  }
}

export async function readSecureCookie<T = unknown>(name: string): Promise<T | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(name)?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return (payload as { data: T }).data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Blackshield] Failed to read secure cookie:', error)
    }
    return null
  }
}

export async function deleteSecureCookie(name: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(name)
}
