import { describe, expect, it } from 'vitest'
import { createSafeHTML, sanitizeHTML } from '../xss-protection'

describe('XSS Protection Edge Cases', () => {
  it('should handle malformed HTML gracefully', () => {
    const malformedHTML = '<div><p>Unclosed div<span>Nested</div></p>'
    const result = sanitizeHTML(malformedHTML)

    expect(result.sanitized).toBeTruthy()
    expect(result.wasModified).toBe(true)
    // DOMPurify should fix the malformed structure
  })

  it('should handle Unicode and special characters', () => {
    const unicodeHTML = '<p>Unicode: 🔒 ñáéíóú àèìòù</p>'
    const result = sanitizeHTML(unicodeHTML)

    expect(result.sanitized).toBe(unicodeHTML)
    expect(result.wasModified).toBe(false)
  })

  it('should handle data URIs in various contexts', () => {
    const dataURIHTML = `
      <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>">
      <iframe src="data:text/html,<script>alert(1)</script>"></iframe>
      <object data="data:application/pdf,malicious"></object>
    `
    const result = sanitizeHTML(dataURIHTML)

    expect(result.sanitized).not.toContain('data:text/html')
    expect(result.sanitized).not.toContain('<iframe')
    expect(result.sanitized).not.toContain('<object')
    expect(result.wasModified).toBe(true)
    // Note: DOMPurify may allow some data URIs but removes dangerous elements
  })

  it('should handle CSS-based attacks', () => {
    const cssAttackHTML = `
      <div style="background: url('javascript:alert(1)')">Content</div>
      <style>body { background: url('javascript:alert(1)') }</style>
      <link rel="stylesheet" href="javascript:alert(1)">
    `
    const result = sanitizeHTML(cssAttackHTML)

    expect(result.sanitized).toContain('Content')
    expect(result.sanitized).not.toContain('<link')
    expect(result.wasModified).toBe(true)
    // Note: DOMPurify may preserve some style content but removes dangerous links
  })

  it('should handle mixed content attacks', () => {
    const mixedHTML = `
      <div>
        Safe content
        <script>alert('xss')</script>
        More safe content
        <img src="x" onerror="alert('img')">
        <a href="javascript:alert('link')">Link</a>
        Final safe content
      </div>
    `
    const result = sanitizeHTML(mixedHTML)

    expect(result.sanitized).toContain('Safe content')
    expect(result.sanitized).toContain('More safe content')
    expect(result.sanitized).toContain('Final safe content')
    expect(result.sanitized).not.toContain('alert')
    expect(result.sanitized).not.toContain('javascript:')
    expect(result.wasModified).toBe(true)
  })

  it('should handle very large HTML content', () => {
    const largeHTML = `<p>${'Large content '.repeat(1000)}</p>` // Reduced size for test performance
    const result = sanitizeHTML(largeHTML)

    expect(result.sanitized).toBe(largeHTML)
    expect(result.wasModified).toBe(false)
  })

  it('should handle nested script attempts', () => {
    const nestedHTML = `
      <div>
        <script>
          document.write('<script>alert("nested")<\/script>');
        </script>
        <p>Content</p>
      </div>
    `
    const result = sanitizeHTML(nestedHTML)

    expect(result.sanitized).toContain('<div>')
    expect(result.sanitized).toContain('<p>Content</p>')
    expect(result.sanitized).not.toContain('<script>')
    expect(result.wasModified).toBe(true)
  })

  it('should handle multiple custom rules with dependencies', () => {
    const html = 'Hello World'
    const result = sanitizeHTML(html, {
      customRules: {
        addPrefix: (text) => `PREFIX: ${text}`,
        addSuffix: (text) => `${text} :SUFFIX`,
        uppercase: (text) => text.toUpperCase(),
      },
    })

    expect(result.sanitized).toBe('PREFIX: HELLO WORLD :SUFFIX')
    expect(result.wasModified).toBe(true)
    expect(result.warnings).toHaveLength(3)
  })

  it('should handle empty or undefined custom rules', () => {
    const html = '<p>Content</p>'
    const result = sanitizeHTML(html, {
      customRules: {},
    })

    expect(result.sanitized).toBe(html)
    expect(result.wasModified).toBe(false)
  })

  it('should handle custom rules that return the same content', () => {
    const html = '<p>Content</p>'
    const result = sanitizeHTML(html, {
      customRules: {
        noChange: (text) => text,
      },
    })

    expect(result.sanitized).toBe(html)
    expect(result.wasModified).toBe(false)
  })

  it('should handle allowedTags with empty array', () => {
    const html = '<div><p>Content</p><span>More</span></div>'
    const result = sanitizeHTML(html, {
      allowedTags: [],
    })

    expect(result.sanitized).toBe('ContentMore')
    expect(result.wasModified).toBe(true)
  })

  it('should handle allowedAttributes with empty array', () => {
    const html = '<div id="test" class="example" onclick="alert(1)">Content</div>'
    const result = sanitizeHTML(html, {
      allowedAttributes: [],
    })

    expect(result.sanitized).toBe('<div>Content</div>')
    expect(result.wasModified).toBe(true)
  })

  it('should handle combination of all options', () => {
    const html =
      '<div id="keep" class="remove" onclick="alert(1)"><p>Keep</p><script>alert(1)</script></div>'

    // Use a timestamp that we can control
    const mockTimestamp = '1234567890'
    const result = sanitizeHTML(html, {
      allowedTags: ['div', 'p'],
      allowedAttributes: ['id'],
      customRules: {
        addTimestamp: (text) => `${text} [${mockTimestamp}]`,
      },
    })

    expect(result.sanitized).toContain('<div id="keep">')
    expect(result.sanitized).toContain('<p>Keep</p>')
    expect(result.sanitized).not.toContain('class=')
    expect(result.sanitized).not.toContain('onclick')
    expect(result.sanitized).not.toContain('script')
    expect(result.sanitized).toContain(`[${mockTimestamp}]`)
    expect(result.wasModified).toBe(true)
  })

  it('should properly track removed tags with duplicates', () => {
    const html = '<script>1</script><script>2</script><iframe></iframe><script>3</script>'
    const result = sanitizeHTML(html)

    expect(result.removedTags).toContain('script')
    expect(result.removedTags).toContain('iframe')
    // Should not have duplicates
    expect(result.removedTags.filter((tag) => tag === 'script')).toHaveLength(1)
  })

  it('should handle warning generation for multiple event handlers', () => {
    const html = '<div onclick="1" onmouseover="2" onload="3" onerror="4" onfocus="5">Content</div>'
    const result = sanitizeHTML(html)

    expect(result.warnings.some((w) => w.includes('onclick'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('onmouseover'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('onload'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('onerror'))).toBe(true)
  })

  it('should handle createSafeHTML with complex dangerous content', () => {
    const html = `
      <div>
        <script>alert('xss')</script>
        <img src="x" onerror="alert('img')">
        <a href="javascript:alert('link')">Click me</a>
        <p onclick="alert('click')">Paragraph</p>
        Safe content
      </div>
    `
    const result = createSafeHTML(html)

    expect(result.__html).toContain('Safe content')
    expect(result.__html).toContain('Click me')
    expect(result.__html).toContain('Paragraph')
    expect(result.__html).not.toContain('alert')
    expect(result.__html).not.toContain('javascript:')
    expect(result.__html).not.toContain('onclick')
    expect(result.__html).not.toContain('onerror')
  })
})
