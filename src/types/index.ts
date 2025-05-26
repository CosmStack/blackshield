import type { z } from 'zod'

// Core configuration types
export interface BlackshieldConfig {
  /** Enable development mode warnings */
  dev?: boolean
  /** Custom environment variable validation */
  envValidation?: {
    /** Allowed NEXT_PUBLIC_ variables */
    allowedPublicVars?: string[]
    /** Custom validation schema */
    schema?: z.ZodSchema
  }
  /** XSS protection settings */
  xssProtection?: {
    /** Enable automatic sanitization */
    autoSanitize?: boolean
    /** Custom sanitization rules */
    customRules?: Record<string, (input: string) => string>
  }
  /** Server/client boundary protection */
  boundaryProtection?: {
    /** Enable server-side validation */
    validateServerProps?: boolean
    /** Custom prop validators */
    customValidators?: Record<string, z.ZodSchema>
  }
  /** CSRF protection settings */
  csrfProtection?: {
    /** Enable CSRF protection */
    enabled?: boolean
    /** Custom token header name */
    tokenHeader?: string
    /** Custom token cookie name */
    tokenCookie?: string
    /** Token expiry time in seconds */
    tokenExpiry?: number
  }
}

// User and authentication types
export interface SecureUser {
  id: string
  email?: string
  roles?: string[]
  permissions?: string[]
  metadata?: Record<string, unknown>
}

export interface AuthContext {
  user: SecureUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error?: Error
}

// Route protection types
export interface RouteGuardConfig {
  /** Required roles for access */
  requiredRoles?: string[]
  /** Required permissions for access */
  requiredPermissions?: string[]
  /** Redirect path for unauthorized users */
  redirectTo?: string
  /** Custom authorization logic */
  customAuth?: (user: SecureUser | null) => boolean
}

// Server validation types
export interface ServerInputValidation<T = unknown> {
  data: T
  errors: Record<string, string[]>
  isValid: boolean
}

// Environment variable types
export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  exposedVars: string[]
}

// Environment audit types
export interface EnvAuditResult {
  isValid: boolean
  sensitiveVars: Array<{
    name: string
    file: string
    line: number
    severity: 'error' | 'warning'
    suggestion: string
  }>
  summary: {
    totalVars: number
    sensitiveCount: number
    filesScanned: string[]
  }
}

// CSRF protection types
export interface CsrfToken {
  token: string
  expiresAt: number
}

export interface CsrfConfig {
  tokenHeader?: string
  tokenCookie?: string
  tokenExpiry?: number
}

// XSS protection types
export interface XSSProtectionResult {
  sanitized: string
  wasModified: boolean
  removedTags: string[]
  warnings: string[]
}

// Analysis types for static checking
export interface SecurityIssue {
  type:
    | 'env-exposure'
    | 'xss-vulnerability'
    | 'boundary-violation'
    | 'csrf-vulnerability'
    | 'env-leak'
  severity: 'error' | 'warning' | 'info'
  message: string
  file: string
  line: number
  column: number
  suggestion?: string
}

export interface AnalysisResult {
  projectPath: string
  timestamp: string
  issues: SecurityIssue[]
  summary: {
    total: number
    errors: number
    warnings: number
    info: number
  }
  config: BlackshieldConfig
}
