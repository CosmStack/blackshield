import { describe, expect, it } from 'vitest'
import { noUnsafeEnv } from '../no-unsafe-env'

describe('no-unsafe-env ESLint rule', () => {
  it('should be defined and have basic structure', () => {
    expect(noUnsafeEnv).toBeDefined()
    expect(noUnsafeEnv.meta).toBeDefined()
    expect(noUnsafeEnv.create).toBeDefined()
    expect(typeof noUnsafeEnv.create).toBe('function')
  })

  it('should have correct rule type', () => {
    expect(noUnsafeEnv.meta.type).toBe('problem')
  })

  it('should have messages defined', () => {
    expect(noUnsafeEnv.meta.messages).toBeDefined()
    expect(noUnsafeEnv.meta.messages.unsafeEnv).toBeDefined()
    expect(noUnsafeEnv.meta.messages.suggestServerSide).toBeDefined()
  })

  it('should have default options', () => {
    expect(noUnsafeEnv.defaultOptions).toEqual([{ allowedVars: [] }])
  })
})
