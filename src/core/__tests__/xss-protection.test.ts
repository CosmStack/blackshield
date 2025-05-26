import { describe, expect, it } from 'vitest'
import { createSafeHTML, sanitizeHTML, useSanitizedHTML } from '../xss-protection'

describe('sanitizeHTML', () => {
  it('should remove dangerous script tags', () => {
    const input = '<script>alert("xss")</script><p>Safe content</p>'
    const result = sanitizeHTML(input)

    expect(result.sanitized).toBe('<p>Safe content</p>')
    expect(result.wasModified).toBe(true)
    expect(result.warnings.some((w) => w.includes('script') || w.includes('Removed'))).toBe(true)
  })

  it('should remove dangerous attributes', () => {
    const input = '<div onclick="alert(\'xss\')">Content</div>'
    const result = sanitizeHTML(input)

    // DOMPurify should remove the onclick attribute
    expect(result.sanitized).toBe('<div>Content</div>')
    expect(result.wasModified).toBe(true)
  })

  it('should allow safe content unchanged', () => {
    const input = '<p>This is <strong>safe</strong> content</p>'
    const result = sanitizeHTML(input)

    expect(result.sanitized).toBe(input)
    expect(result.wasModified).toBe(false)
    expect(result.removedTags).toHaveLength(0)
  })

  it('should respect allowed tags configuration', () => {
    const input = '<script>alert("xss")</script><p>Content</p><div>More content</div>'
    const result = sanitizeHTML(input, {
      allowedTags: ['p'], // Only allow p tags, not div or script
    })

    // Script should be removed (never allowed), div should be removed, p should remain
    expect(result.sanitized).not.toContain('script')
    expect(result.sanitized).not.toContain('<div>')
    expect(result.sanitized).toContain('<p>Content</p>')
    expect(result.sanitized).toContain('More content') // Content should remain even if tag is removed
  })

  it('should apply custom rules', () => {
    const input = 'Hello WORLD'
    const result = sanitizeHTML(input, {
      customRules: {
        lowercase: (text) => text.toLowerCase(),
      },
    })

    expect(result.sanitized).toBe('hello world')
    expect(result.wasModified).toBe(true)
    expect(result.warnings).toContain('Applied custom rule: lowercase')
  })

  it('should handle multiple dangerous elements', () => {
    const input = '<script>alert(1)</script><iframe src="evil.com"></iframe><p>Safe</p>'
    const result = sanitizeHTML(input)

    expect(result.sanitized).toBe('<p>Safe</p>')
    expect(result.wasModified).toBe(true)
  })

  it('should handle empty input', () => {
    const result = sanitizeHTML('')

    expect(result.sanitized).toBe('')
    expect(result.wasModified).toBe(false)
    expect(result.removedTags).toHaveLength(0)
  })

  it('should handle plain text', () => {
    const input = 'Just plain text'
    const result = sanitizeHTML(input)

    expect(result.sanitized).toBe(input)
    expect(result.wasModified).toBe(false)
  })
})

describe('createSafeHTML', () => {
  it('should return object with __html property', () => {
    const input = '<p>Safe content</p>'
    const result = createSafeHTML(input)

    expect(result).toHaveProperty('__html')
    expect(result.__html).toBe(input)
  })

  it('should sanitize dangerous content', () => {
    const input = '<script>alert("xss")</script><p>Safe</p>'
    const result = createSafeHTML(input)

    expect(result.__html).toBe('<p>Safe</p>')
  })
})

describe('useSanitizedHTML', () => {
  it('should work as a hook-like function', () => {
    const input = '<script>alert("xss")</script><p>Safe content</p>'
    const result = useSanitizedHTML(input)

    expect(result.sanitized).toBe('<p>Safe content</p>')
    expect(result.wasModified).toBe(true)
  })

  it('should accept options', () => {
    const input = 'Hello WORLD'
    const result = useSanitizedHTML(input, {
      customRules: {
        lowercase: (text) => text.toLowerCase(),
      },
    })

    expect(result.sanitized).toBe('hello world')
    expect(result.wasModified).toBe(true)
  })
})
