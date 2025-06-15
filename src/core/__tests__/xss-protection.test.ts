import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('should respect allowed attributes configuration', () => {
    const input = '<div id="safe" class="danger" onclick="alert(1)">Content</div>'
    const result = sanitizeHTML(input, {
      allowedAttributes: ['id'], // Only allow id attribute
    })

    expect(result.sanitized).toContain('id="safe"')
    expect(result.sanitized).not.toContain('class="danger"')
    expect(result.sanitized).not.toContain('onclick')
    expect(result.wasModified).toBe(true)
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

  it('should apply multiple custom rules in order', () => {
    const input = 'Hello WORLD'
    const result = sanitizeHTML(input, {
      customRules: {
        lowercase: (text) => text.toLowerCase(),
        addPrefix: (text) => `PREFIX: ${text}`,
      },
    })

    expect(result.sanitized).toBe('PREFIX: hello world')
    expect(result.wasModified).toBe(true)
    expect(result.warnings).toContain('Applied custom rule: lowercase')
    expect(result.warnings).toContain('Applied custom rule: addPrefix')
  })

  it('should handle multiple dangerous elements', () => {
    const input = '<script>alert(1)</script><iframe src="evil.com"></iframe><p>Safe</p>'
    const result = sanitizeHTML(input)

    expect(result.sanitized).toBe('<p>Safe</p>')
    expect(result.wasModified).toBe(true)
  })

  it('should handle complex XSS patterns', () => {
    const input = `
      <img src="x" onerror="alert(1)">
      <a href="javascript:alert(1)">Link</a>
      <div style="background: url('javascript:alert(1)')">Content</div>
      <object data="data:text/html,<script>alert(1)</script>"></object>
    `
    const result = sanitizeHTML(input)

    expect(result.sanitized).not.toContain('onerror')
    expect(result.sanitized).not.toContain('data:text/html')
    expect(result.wasModified).toBe(true)
    // Note: DOMPurify may not remove all javascript: URLs in CSS, but removes dangerous scripts
  })

  it('should detect and warn about removed event handlers', () => {
    const input = '<div onmouseover="alert(1)" onload="alert(2)">Content</div>'
    const result = sanitizeHTML(input)

    expect(result.warnings.some((w) => w.includes('onmouseover'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('onload'))).toBe(true)
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
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    originalNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    vi.unstubAllEnvs()
  })

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

  it('should warn in development mode when content is modified', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const input = '<script>alert("xss")</script><p>Safe</p>'

    createSafeHTML(input)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Blackshield] HTML was sanitized:',
      expect.objectContaining({
        removedTags: expect.any(Array),
        warnings: expect.any(Array),
      }),
    )
  })

  it('should not warn in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const input = '<script>alert("xss")</script><p>Safe</p>'

    createSafeHTML(input)

    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should not warn when content is not modified', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const input = '<p>Safe content</p>'

    createSafeHTML(input)

    expect(consoleWarnSpy).not.toHaveBeenCalled()
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

  it('should support all sanitization options', () => {
    const input =
      '<div class="test" onclick="alert(1)"><script>alert(1)</script><p>Content</p></div>'
    const result = useSanitizedHTML(input, {
      allowedTags: ['div', 'p'],
      allowedAttributes: ['class'],
      customRules: {
        addSuffix: (text) => `${text} [PROCESSED]`,
      },
    })

    expect(result.sanitized).toContain('class="test"')
    expect(result.sanitized).not.toContain('onclick')
    expect(result.sanitized).not.toContain('script')
    expect(result.sanitized).toContain('[PROCESSED]')
    expect(result.wasModified).toBe(true)
  })
})
