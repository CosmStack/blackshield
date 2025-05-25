import type { BlackshieldConfig } from '../types'

export const DEFAULT_CONFIG: Required<BlackshieldConfig> = {
  dev: process.env.NODE_ENV === 'development',
  envValidation: {
    allowedPublicVars: ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_VERCEL_URL'],
    schema: undefined,
  },
  xssProtection: {
    autoSanitize: true,
    customRules: {},
  },
  boundaryProtection: {
    validateServerProps: true,
    customValidators: {},
  },
}

export const DANGEROUS_ENV_PATTERNS = [
  /^NEXT_PUBLIC_.*SECRET/i,
  /^NEXT_PUBLIC_.*KEY/i,
  /^NEXT_PUBLIC_.*TOKEN/i,
  /^NEXT_PUBLIC_.*PASSWORD/i,
  /^NEXT_PUBLIC_.*PRIVATE/i,
  /^NEXT_PUBLIC_.*API_SECRET/i,
  /^NEXT_PUBLIC_.*DATABASE/i,
]

export const XSS_DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'textarea',
  'select',
  'button',
]

export const XSS_DANGEROUS_ATTRIBUTES = [
  'onclick',
  'onload',
  'onerror',
  'onmouseover',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'javascript:',
]
