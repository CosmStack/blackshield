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

// XSS protection types
export interface XSSProtectionResult {
  sanitized: string
  wasModified: boolean
  removedTags: string[]
  warnings: string[]
}

// Analysis types for static checking
export interface SecurityIssue {
  type: 'env-exposure' | 'xss-vulnerability' | 'boundary-violation'
  severity: 'error' | 'warning' | 'info'
  message: string
  file: string
  line: number
  column: number
  suggestion?: string
}

export interface AnalysisResult {
  issues: SecurityIssue[]
  summary: {
    errors: number
    warnings: number
    info: number
  }
}
