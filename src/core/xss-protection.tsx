import { XSS_DANGEROUS_ATTRIBUTES, XSS_DANGEROUS_TAGS } from '../config/defaults'
import type { XSSProtectionResult } from '../types'

export function sanitizeHTML(
  input: string,
  options: {
    allowedTags?: string[]
    allowedAttributes?: string[]
    customRules?: Record<string, (input: string) => string>
  } = {},
): XSSProtectionResult {
  const warnings: string[] = []
  const removedTags: string[] = []
  let sanitized = input
  let wasModified = false

  // Apply custom rules first
  if (options.customRules) {
    for (const [ruleName, ruleFunction] of Object.entries(options.customRules)) {
      const before = sanitized
      sanitized = ruleFunction(sanitized)
      if (before !== sanitized) {
        wasModified = true
        warnings.push(`Applied custom rule: ${ruleName}`)
      }
    }
  }

  // Remove dangerous tags
  const allowedTags = options.allowedTags || []
  for (const tag of XSS_DANGEROUS_TAGS) {
    if (!allowedTags.includes(tag)) {
      const tagRegex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi')
      const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi')

      if (tagRegex.test(sanitized) || selfClosingRegex.test(sanitized)) {
        sanitized = sanitized.replace(tagRegex, '')
        sanitized = sanitized.replace(selfClosingRegex, '')
        removedTags.push(tag)
        wasModified = true
      }
    }
  }

  // Remove dangerous attributes
  const allowedAttributes = options.allowedAttributes || []
  for (const attr of XSS_DANGEROUS_ATTRIBUTES) {
    if (!allowedAttributes.includes(attr)) {
      const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
      if (attrRegex.test(sanitized)) {
        sanitized = sanitized.replace(attrRegex, '')
        wasModified = true
        warnings.push(`Removed dangerous attribute: ${attr}`)
      }
    }
  }

  return {
    sanitized,
    wasModified,
    removedTags,
    warnings,
  }
}

export function createSafeHTML(html: string): { __html: string } {
  const result = sanitizeHTML(html)

  if (process.env.NODE_ENV === 'development' && result.wasModified) {
    console.warn('[Blackshield] HTML was sanitized:', {
      removedTags: result.removedTags,
      warnings: result.warnings,
    })
  }

  return { __html: result.sanitized }
}

// React component for safe HTML rendering
export function SafeHTML({
  html,
  tag = 'div',
  className,
  ...props
}: {
  html: string
  tag?: keyof JSX.IntrinsicElements
  className?: string
  [key: string]: unknown
}) {
  const safeHTML = createSafeHTML(html)
  const Tag = tag as keyof JSX.IntrinsicElements

  return <Tag className={className} dangerouslySetInnerHTML={safeHTML} {...props} />
}
