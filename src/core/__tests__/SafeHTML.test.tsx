import { render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SafeHTML } from '../xss-protection'

describe('SafeHTML Component', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('should render safe HTML content', () => {
    const safeHTML = '<p>This is <strong>safe</strong> content</p>'

    render(<SafeHTML html={safeHTML} data-testid="safe-content" />)

    const element = screen.getByTestId('safe-content')
    expect(element).toBeDefined()
    expect(element.tagName).toBe('DIV') // Default tag
    expect(element.innerHTML).toBe('<p>This is <strong>safe</strong> content</p>')
  })

  it('should sanitize dangerous content', () => {
    const dangerousHTML = '<script>alert("xss")</script><p>Safe content</p>'

    render(<SafeHTML html={dangerousHTML} data-testid="safe-html" />)

    const element = screen.getByTestId('safe-html')
    expect(element.innerHTML).toBe('<p>Safe content</p>')
    expect(element.innerHTML).not.toContain('script')
  })

  it('should render with custom tag', () => {
    const html = '<strong>Bold text</strong>'

    render(<SafeHTML html={html} tag="span" data-testid="custom-tag" />)

    const element = screen.getByTestId('custom-tag')
    expect(element.tagName).toBe('SPAN')
    expect(element.innerHTML).toBe('<strong>Bold text</strong>')
  })

  it('should handle different HTML tag types', () => {
    const testCases = [
      { tag: 'div' as const, expected: 'DIV' },
      { tag: 'p' as const, expected: 'P' },
      { tag: 'span' as const, expected: 'SPAN' },
      { tag: 'section' as const, expected: 'SECTION' },
      { tag: 'article' as const, expected: 'ARTICLE' },
      { tag: 'header' as const, expected: 'HEADER' },
      { tag: 'footer' as const, expected: 'FOOTER' },
    ]

    for (const { tag, expected } of testCases) {
      const { unmount } = render(
        <SafeHTML html="<strong>Content</strong>" tag={tag} data-testid={`tag-${tag}`} />,
      )

      const element = screen.getByTestId(`tag-${tag}`)
      expect(element.tagName).toBe(expected)

      unmount()
    }
  })

  it('should apply className correctly', () => {
    const html = '<p>Content</p>'

    render(<SafeHTML html={html} className="custom-class" data-testid="with-class" />)

    const element = screen.getByTestId('with-class')
    expect(element.classList.contains('custom-class')).toBe(true)
  })

  it('should spread additional props', () => {
    const html = '<p>Content</p>'

    render(
      <SafeHTML
        html={html}
        data-testid="with-props"
        aria-label="Custom label"
        role="banner"
        id="custom-id"
      />,
    )

    const element = screen.getByTestId('with-props')
    expect(element.getAttribute('aria-label')).toBe('Custom label')
    expect(element.getAttribute('role')).toBe('banner')
    expect(element.getAttribute('id')).toBe('custom-id')
  })

  it('should handle allowedTags configuration', () => {
    const html = '<div>Div content</div><p>Para content</p><script>alert(1)</script>'

    render(<SafeHTML html={html} allowedTags={['p']} data-testid="allowed-tags" />)

    const element = screen.getByTestId('allowed-tags')
    expect(element.innerHTML).toContain('<p>Para content</p>')
    expect(element.innerHTML).not.toContain('<div>')
    expect(element.innerHTML).not.toContain('script')
    expect(element.innerHTML).toContain('Div content') // Content should remain
  })

  it('should handle allowedAttributes configuration', () => {
    const html = '<div id="safe" class="danger" onclick="alert(1)">Content</div>'

    render(<SafeHTML html={html} allowedAttributes={['id']} data-testid="allowed-attrs" />)

    const element = screen.getByTestId('allowed-attrs')
    expect(element.innerHTML).toContain('id="safe"')
    expect(element.innerHTML).not.toContain('class="danger"')
    expect(element.innerHTML).not.toContain('onclick')
  })

  it('should handle combined allowedTags and allowedAttributes', () => {
    const html = '<div id="keep" class="remove">Div</div><p class="keep">Para</p><span>Span</span>'

    render(
      <SafeHTML
        html={html}
        allowedTags={['div', 'p']}
        allowedAttributes={['id']}
        data-testid="combined-config"
      />,
    )

    const element = screen.getByTestId('combined-config')
    expect(element.innerHTML).toContain('<div id="keep">Div</div>')
    expect(element.innerHTML).toContain('<p>Para</p>')
    expect(element.innerHTML).toContain('Span') // Content remains
    expect(element.innerHTML).not.toContain('class=')
    expect(element.innerHTML).not.toContain('<span>')
  })

  it('should handle empty HTML', () => {
    render(<SafeHTML html="" data-testid="empty-html" />)

    const element = screen.getByTestId('empty-html')
    expect(element.innerHTML).toBe('')
  })

  it('should handle plain text', () => {
    render(<SafeHTML html="Plain text only" data-testid="plain-text" />)

    const element = screen.getByTestId('plain-text')
    expect(element.innerHTML).toBe('Plain text only')
  })

  it('should warn in development when content is sanitized', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const dangerousHTML = '<script>alert("xss")</script><p>Safe</p>'

    render(<SafeHTML html={dangerousHTML} />)

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
    const dangerousHTML = '<script>alert("xss")</script><p>Safe</p>'

    render(<SafeHTML html={dangerousHTML} />)

    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should handle complex nested HTML structures', () => {
    const html = `
      <div>
        <header>
          <h1>Title</h1>
          <script>alert("xss")</script>
        </header>
        <main>
          <p onclick="alert('click')">Content</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </main>
      </div>
    `

    render(<SafeHTML html={html} data-testid="complex-html" />)

    const element = screen.getByTestId('complex-html')
    expect(element.innerHTML).toContain('<h1>Title</h1>')
    expect(element.innerHTML).toContain('<p>Content</p>')
    expect(element.innerHTML).toContain('<li>Item 1</li>')
    expect(element.innerHTML).not.toContain('script')
    expect(element.innerHTML).not.toContain('onclick')
  })

  it('should handle SVG elements when tag is svg', () => {
    const svgHTML = '<span>SVG content</span>'

    render(<SafeHTML html={svgHTML} tag="svg" allowedTags={['span']} data-testid="svg-element" />)

    const element = screen.getByTestId('svg-element')
    expect(element.tagName.toLowerCase()).toBe('svg')
    expect(element.innerHTML).toContain('SVG content')
  })

  it('should handle boolean and numeric props', () => {
    const html = '<p>Content</p>'

    render(
      <SafeHTML
        html={html}
        data-testid="boolean-numeric-props"
        hidden={false}
        tabIndex={0}
        aria-expanded={true}
      />,
    )

    const element = screen.getByTestId('boolean-numeric-props')
    expect(element.getAttribute('tabindex')).toBe('0')
    expect(element.getAttribute('aria-expanded')).toBe('true')
    expect(element.getAttribute('hidden')).toBeNull()
  })

  it('should preserve existing dangerouslySetInnerHTML structure', () => {
    const html = '<em>Emphasized</em>'

    render(<SafeHTML html={html} data-testid="inner-html" />)

    const element = screen.getByTestId('inner-html')
    // The component should use dangerouslySetInnerHTML internally
    expect(element.innerHTML).toBe('<em>Emphasized</em>')
  })
})
