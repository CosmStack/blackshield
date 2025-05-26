import { describe, expect, it } from 'vitest'
import { noUnsafeHtml } from '../no-unsafe-html'

describe('no-unsafe-html ESLint rule', () => {
  it('should be defined and have basic structure', () => {
    expect(noUnsafeHtml).toBeDefined()
    expect(noUnsafeHtml.meta).toBeDefined()
    expect(noUnsafeHtml.create).toBeDefined()
    expect(typeof noUnsafeHtml.create).toBe('function')
  })

  it('should have correct rule type', () => {
    expect(noUnsafeHtml.meta.type).toBe('problem')
  })

  it('should have messages defined', () => {
    expect(noUnsafeHtml.meta.messages).toBeDefined()
    expect(noUnsafeHtml.meta.messages.unsafeHtml).toBeDefined()
    expect(noUnsafeHtml.meta.messages.suggestSafeHtml).toBeDefined()
    expect(noUnsafeHtml.meta.messages.unsafeInnerHtml).toBeDefined()
  })

  it('should have default options', () => {
    expect(noUnsafeHtml.defaultOptions).toEqual([])
  })

  it('should have fixable property set to code', () => {
    expect(noUnsafeHtml.meta.fixable).toBe('code')
  })
})
