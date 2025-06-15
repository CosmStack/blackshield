import DOMPurify from 'isomorphic-dompurify'
import type { JSX } from 'react'
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

  // Configure DOMPurify
  const config: Record<string, unknown> = {}

  if (options.allowedTags) {
    config.ALLOWED_TAGS = options.allowedTags
  }

  if (options.allowedAttributes) {
    config.ALLOWED_ATTR = options.allowedAttributes
  }

  // Store original content to compare
  const originalContent = sanitized

  // Sanitize with DOMPurify and convert to string
  const purifiedResult = DOMPurify.sanitize(sanitized, config)
  const purified = String(purifiedResult) // Convert TrustedHTML to string

  // Check if content was modified
  if (purified !== originalContent) {
    wasModified = true

    // Try to detect what was removed (basic detection)
    const originalTags = originalContent.match(/<(\w+)[^>]*>/g) || []
    const purifiedTags = purified.match(/<(\w+)[^>]*>/g) || []

    const originalTagNames = originalTags
      .map((tag) => tag.match(/<(\w+)/)?.[1])
      .filter(Boolean) as string[]
    const purifiedTagNames = purifiedTags
      .map((tag) => tag.match(/<(\w+)/)?.[1])
      .filter(Boolean) as string[]

    const removed = originalTagNames.filter((tag) => !purifiedTagNames.includes(tag))
    removedTags.push(...removed)

    if (removed.length > 0) {
      warnings.push(`Removed potentially dangerous tags: ${removed.join(', ')}`)
    }

    // Check for script content
    if (originalContent.includes('<script') && !purified.includes('<script')) {
      warnings.push('Removed script tags')
    }

    // Check for event handlers
    const eventHandlers = ['onclick', 'onload', 'onerror', 'onmouseover']
    for (const handler of eventHandlers) {
      if (originalContent.includes(handler) && !purified.includes(handler)) {
        warnings.push(`Removed ${handler} event handler`)
      }
    }
  }

  return {
    sanitized: purified,
    wasModified,
    removedTags: [...new Set(removedTags)], // Remove duplicates
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
  allowedTags,
  allowedAttributes,
  ...props
}: {
  html: string
  tag?: keyof JSX.IntrinsicElements
  className?: string
  allowedTags?: string[]
  allowedAttributes?: string[]
} & Record<string, unknown>) {
  const sanitizationOptions = {
    allowedTags,
    allowedAttributes,
  }
  const result = sanitizeHTML(html, sanitizationOptions)

  if (process.env.NODE_ENV === 'development' && result.wasModified) {
    console.warn('[Blackshield] HTML was sanitized:', {
      removedTags: result.removedTags,
      warnings: result.warnings,
    })
  }

  const safeHTML = { __html: result.sanitized }
  const Tag = tag as keyof JSX.IntrinsicElements

  return <Tag className={className} dangerouslySetInnerHTML={safeHTML} {...props} />
}

// Hook for sanitized HTML
export function useSanitizedHTML(
  html: string,
  options?: {
    allowedTags?: string[]
    allowedAttributes?: string[]
    customRules?: Record<string, (input: string) => string>
  },
): XSSProtectionResult {
  return sanitizeHTML(html, options)
}
