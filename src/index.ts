// Core components and hooks
export { SecureProvider, useBlackshield } from './core/context'
export { useSecureUser } from './hooks/useSecureUser'
export { useGuardedRoute } from './hooks/useGuardedRoute'
export { useCsrfProtection, getCsrfToken } from './hooks/useCsrfProtection'
export { sanitizeHTML, createSafeHTML, SafeHTML, useSanitizedHTML } from './core/xss-protection'
export { validateEnvironmentVariables, createEnvValidator } from './core/env-validator'
export { envAudit, scanEnvFiles } from './core/env-audit'

// Configuration
export { DEFAULT_CONFIG } from './config/defaults'

// Types
export type {
  BlackshieldConfig,
  SecureUser,
  AuthContext,
  RouteGuardConfig,
  EnvValidationResult,
  EnvAuditResult,
  CsrfToken,
  CsrfConfig,
  XSSProtectionResult,
  SecurityIssue,
  AnalysisResult,
} from './types'
