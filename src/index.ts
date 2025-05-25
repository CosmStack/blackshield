// Core exports
export { SecureProvider, useBlackshield } from './core/context'
export { validateEnvironmentVariables, createEnvValidator } from './core/env-validator'
export { sanitizeHTML, createSafeHTML, SafeHTML } from './core/xss-protection'

// Hooks
export { useSecureUser } from './hooks/useSecureUser'
export { useGuardedRoute } from './hooks/useGuardedRoute'

// Types
export type {
  BlackshieldConfig,
  SecureUser,
  AuthContext,
  RouteGuardConfig,
  EnvValidationResult,
  XSSProtectionResult,
  SecurityIssue,
  AnalysisResult,
} from './types'

// Default configuration
export { DEFAULT_CONFIG } from './config/defaults'
