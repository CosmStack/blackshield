import { describe, expect, it } from 'vitest'
import { noPublicSensitiveEnv } from '../no-public-sensitive-env'

describe('no-public-sensitive-env ESLint rule', () => {
  it('should be defined and have basic structure', () => {
    expect(noPublicSensitiveEnv).toBeDefined()
    expect(noPublicSensitiveEnv.meta).toBeDefined()
    expect(noPublicSensitiveEnv.create).toBeDefined()
    expect(typeof noPublicSensitiveEnv.create).toBe('function')
  })

  it('should have correct rule type', () => {
    expect(noPublicSensitiveEnv.meta.type).toBe('problem')
  })

  it('should have messages defined', () => {
    expect(noPublicSensitiveEnv.meta.messages).toBeDefined()
    expect(noPublicSensitiveEnv.meta.messages.sensitivePublicEnv).toBeDefined()
    expect(noPublicSensitiveEnv.meta.messages.suggestServerSide).toBeDefined()
    expect(noPublicSensitiveEnv.meta.messages.suggestAllowList).toBeDefined()
  })

  it('should have default options with empty arrays', () => {
    expect(noPublicSensitiveEnv.defaultOptions).toEqual([{ allowedVars: [], customPatterns: [] }])
  })

  it('should have fixable property set to code', () => {
    expect(noPublicSensitiveEnv.meta.fixable).toBe('code')
  })

  it('should have schema for configuration', () => {
    expect(noPublicSensitiveEnv.meta.schema).toBeDefined()
    expect(Array.isArray(noPublicSensitiveEnv.meta.schema)).toBe(true)

    const schema = noPublicSensitiveEnv.meta.schema as any[]
    expect(schema[0]).toHaveProperty('properties')
    expect(schema[0].properties).toHaveProperty('allowedVars')
    expect(schema[0].properties).toHaveProperty('customPatterns')
  })
})
