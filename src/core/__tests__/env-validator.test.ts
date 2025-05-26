import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateEnvironmentVariables } from '../env-validator'

describe('validateEnvironmentVariables', () => {
  beforeEach(() => {
    // Clear environment variables
    vi.unstubAllEnvs()
  })

  it('should pass validation when no NEXT_PUBLIC_ variables are present', () => {
    const result = validateEnvironmentVariables()

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.exposedVars).toHaveLength(0)
  })

  it('should detect dangerous environment variable patterns', () => {
    vi.stubEnv('NEXT_PUBLIC_API_SECRET', 'secret-value')

    const result = validateEnvironmentVariables()

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('NEXT_PUBLIC_API_SECRET')
    expect(result.errors[0]).toContain('Potentially sensitive environment variable exposed')
    expect(result.exposedVars).toContain('NEXT_PUBLIC_API_SECRET')
  })

  it('should allow explicitly allowed variables', () => {
    vi.stubEnv('NEXT_PUBLIC_API_SECRET', 'secret-value')

    const result = validateEnvironmentVariables({
      allowedPublicVars: ['NEXT_PUBLIC_API_SECRET'],
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should warn about variables not in allow list', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com')

    const result = validateEnvironmentVariables({
      allowedPublicVars: ['NEXT_PUBLIC_API_URL'], // Different variable
    })

    expect(result.warnings[0]).toContain('NEXT_PUBLIC_APP_URL')
    expect(result.warnings[0]).toContain('is not in allowedPublicVars list')
  })

  it('should detect multiple dangerous patterns', () => {
    vi.stubEnv('NEXT_PUBLIC_SECRET_KEY', 'secret')
    vi.stubEnv('NEXT_PUBLIC_DATABASE_URL', 'postgres://...')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com')

    const result = validateEnvironmentVariables()

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(2) // SECRET_KEY and DATABASE_URL
    expect(result.exposedVars).toHaveLength(3)
  })
})
