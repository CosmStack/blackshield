import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateCsrfToken, validateCsrfToken, verifyCsrfToken } from '../csrf'

// Mock jose
vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: vi.fn(),
}))

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

const { jwtVerify } = await import('jose')
const mockJwtVerify = vi.mocked(jwtVerify)

// Mock environment variable
const originalEnv = process.env.JWT_SECRET
beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters'
  vi.clearAllMocks()
})

afterEach(() => {
  process.env.JWT_SECRET = originalEnv
})

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('should generate a valid CSRF token', async () => {
      const result = await generateCsrfToken()

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('expiresAt')
      expect(typeof result.token).toBe('string')
      expect(typeof result.expiresAt).toBe('number')
      expect(result.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should respect custom expiry time', async () => {
      const customExpiry = 1800 // 30 minutes
      const result = await generateCsrfToken({ tokenExpiry: customExpiry })

      const expectedExpiry = Date.now() + customExpiry * 1000
      expect(result.expiresAt).toBeCloseTo(expectedExpiry, -3) // Within 1 second
    })
  })

  describe('verifyCsrfToken', () => {
    it('should verify valid CSRF token', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          type: 'csrf',
          exp: Math.floor((Date.now() + 3600000) / 1000), // 1 hour from now
        },
        protectedHeader: {},
      } as any)

      const result = await verifyCsrfToken('valid-token')
      expect(result).toBe(true)
    })

    it('should reject expired token', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          type: 'csrf',
          exp: Math.floor((Date.now() - 3600000) / 1000), // 1 hour ago
        },
        protectedHeader: {},
      } as any)

      const result = await verifyCsrfToken('expired-token')
      expect(result).toBe(false)
    })

    it('should reject token with wrong type', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          type: 'session',
          exp: Math.floor((Date.now() + 3600000) / 1000),
        },
        protectedHeader: {},
      } as any)

      const result = await verifyCsrfToken('wrong-type-token')
      expect(result).toBe(false)
    })

    it('should reject invalid token', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'))

      const result = await verifyCsrfToken('invalid-token')
      expect(result).toBe(false)
    })
  })

  describe('validateCsrfToken', () => {
    it('should allow safe HTTP methods without token', async () => {
      const mockReq = {
        method: 'GET',
        headers: { get: vi.fn().mockReturnValue(null) },
        cookies: { get: vi.fn().mockReturnValue(undefined) },
      } as any

      const result = await validateCsrfToken(mockReq)
      expect(result).toBe(true)
    })

    it('should validate token for unsafe methods', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          type: 'csrf',
          exp: Math.floor((Date.now() + 3600000) / 1000),
        },
        protectedHeader: {},
      } as any)

      const mockReq = {
        method: 'POST',
        headers: { get: vi.fn().mockReturnValue('valid-csrf-token') },
        cookies: { get: vi.fn().mockReturnValue(undefined) },
      } as any

      const result = await validateCsrfToken(mockReq)
      expect(result).toBe(true)
    })

    it('should reject unsafe methods without token', async () => {
      const mockReq = {
        method: 'POST',
        headers: { get: vi.fn().mockReturnValue(null) },
        cookies: { get: vi.fn().mockReturnValue(undefined) },
      } as any

      const result = await validateCsrfToken(mockReq)
      expect(result).toBe(false)
    })
  })

  // Note: JWT_SECRET validation is tested in integration tests
})
