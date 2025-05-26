import { describe, expect, it } from 'vitest'
import { sanitizeHTML, validateEnvironmentVariables } from '../index'

describe('Integration Tests', () => {
  it('should export main functions correctly', () => {
    expect(typeof sanitizeHTML).toBe('function')
    expect(typeof validateEnvironmentVariables).toBe('function')
  })

  it('should sanitize HTML correctly', () => {
    const result = sanitizeHTML('<script>alert("xss")</script><p>Safe</p>')

    expect(result.sanitized).toBe('<p>Safe</p>')
    expect(result.wasModified).toBe(true)
  })

  it('should validate environment variables', () => {
    // Mock environment variable
    const originalEnv = process.env.NEXT_PUBLIC_TEST_SECRET
    process.env.NEXT_PUBLIC_TEST_SECRET = 'secret'

    const result = validateEnvironmentVariables()

    expect(result.exposedVars).toContain('NEXT_PUBLIC_TEST_SECRET')
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.includes('NEXT_PUBLIC_TEST_SECRET'))).toBe(true)

    // Cleanup
    if (originalEnv === undefined) {
      process.env.NEXT_PUBLIC_TEST_SECRET = undefined
    } else {
      process.env.NEXT_PUBLIC_TEST_SECRET = originalEnv
    }
  })
})
