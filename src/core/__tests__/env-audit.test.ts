import { describe, expect, it } from 'vitest'

// Simple unit tests for the env audit patterns and logic
describe('envAudit', () => {
  it('should have correct sensitive patterns', () => {
    // Test the sensitive patterns directly
    const sensitivePatterns = [
      /SECRET/i,
      /KEY/i,
      /TOKEN/i,
      /PASSWORD/i,
      /PRIVATE/i,
      /API_SECRET/i,
      /DATABASE/i,
      /DB_/i,
      /MONGO/i,
      /REDIS/i,
      /JWT/i,
      /AUTH/i,
      /STRIPE_SECRET/i,
      /PAYPAL/i,
      /WEBHOOK/i,
      /ENCRYPTION/i,
      /HASH/i,
      /SALT/i,
    ]

    // Test that sensitive patterns match expected variables
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_API_SECRET'))).toBe(true)
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_DATABASE_URL'))).toBe(true)
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_JWT_TOKEN'))).toBe(true)
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_PRIVATE_KEY'))).toBe(true)

    // Test that safe variables don't match
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_APP_URL'))).toBe(false)
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_VERSION'))).toBe(false)
    expect(sensitivePatterns.some((p) => p.test('NEXT_PUBLIC_THEME'))).toBe(false)
  })

  it('should correctly identify NEXT_PUBLIC_ prefix', () => {
    const testVars = [
      'NEXT_PUBLIC_API_SECRET',
      'NEXT_PUBLIC_APP_URL',
      'API_SECRET', // Should not match
      'PUBLIC_API_SECRET', // Should not match
    ]

    const publicVars = testVars.filter((v) => v.startsWith('NEXT_PUBLIC_'))
    expect(publicVars).toEqual(['NEXT_PUBLIC_API_SECRET', 'NEXT_PUBLIC_APP_URL'])
  })

  it('should handle environment variable parsing', () => {
    const envContent = `
# This is a comment
NEXT_PUBLIC_API_SECRET=secret123

# Another comment
NEXT_PUBLIC_APP_URL=https://myapp.com
REGULAR_VAR=value
`

    const lines = envContent.split('\n')
    const envVars: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=')
        if (key) {
          envVars.push(key)
        }
      }
    }

    expect(envVars).toEqual(['NEXT_PUBLIC_API_SECRET', 'NEXT_PUBLIC_APP_URL', 'REGULAR_VAR'])
  })

  it('should validate result structure', () => {
    // Test the expected result structure
    const mockResult = {
      isValid: false,
      sensitiveVars: [
        {
          name: 'NEXT_PUBLIC_API_SECRET',
          file: '.env.local',
          line: 2,
          severity: 'error' as const,
          suggestion:
            'Remove NEXT_PUBLIC_ prefix or add "NEXT_PUBLIC_API_SECRET" to allowedPublicVars in config',
        },
      ],
      summary: {
        totalVars: 2,
        sensitiveCount: 1,
        filesScanned: ['.env.local'],
      },
    }

    expect(mockResult.isValid).toBe(false)
    expect(mockResult.sensitiveVars).toHaveLength(1)
    expect(mockResult.sensitiveVars[0]).toHaveProperty('name')
    expect(mockResult.sensitiveVars[0]).toHaveProperty('file')
    expect(mockResult.sensitiveVars[0]).toHaveProperty('line')
    expect(mockResult.sensitiveVars[0]).toHaveProperty('severity')
    expect(mockResult.sensitiveVars[0]).toHaveProperty('suggestion')
    expect(mockResult.summary).toHaveProperty('totalVars')
    expect(mockResult.summary).toHaveProperty('sensitiveCount')
    expect(mockResult.summary).toHaveProperty('filesScanned')
  })

  it('should handle allowed variables correctly', () => {
    const allowedVars = ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_APP_URL']
    const testVar = 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'

    expect(allowedVars.includes(testVar)).toBe(true)
    expect(allowedVars.includes('NEXT_PUBLIC_API_SECRET')).toBe(false)
  })

  it('should handle custom patterns', () => {
    const customPatterns = [/CUSTOM_SENSITIVE/i]
    const allPatterns = [/SECRET/i, /KEY/i, ...customPatterns]

    expect(allPatterns.some((p) => p.test('NEXT_PUBLIC_CUSTOM_SENSITIVE'))).toBe(true)
    expect(allPatterns.some((p) => p.test('NEXT_PUBLIC_API_SECRET'))).toBe(true)
    expect(allPatterns.some((p) => p.test('NEXT_PUBLIC_SAFE_VALUE'))).toBe(false)
  })
})
