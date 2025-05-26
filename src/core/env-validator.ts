import { ZodError, type ZodSchema } from 'zod'
import { DANGEROUS_ENV_PATTERNS } from '../config/defaults'
import type { EnvValidationResult } from '../types'

export function validateEnvironmentVariables(
  config: { allowedPublicVars?: string[]; schema?: ZodSchema } = {},
): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const exposedVars: string[] = []

  // Get all NEXT_PUBLIC_ environment variables
  const publicVars = Object.keys(process.env).filter((key) => key.startsWith('NEXT_PUBLIC_'))

  exposedVars.push(...publicVars)

  // Check for dangerous patterns
  for (const varName of publicVars) {
    const isDangerous = DANGEROUS_ENV_PATTERNS.some((pattern) => pattern.test(varName))

    if (isDangerous) {
      const isAllowed = config.allowedPublicVars?.includes(varName)
      if (!isAllowed) {
        errors.push(
          `Potentially sensitive environment variable exposed: ${varName}. Consider moving to server-side only or add to allowedPublicVars if intentional.`,
        )
      }
    }
  }

  // Check against allowed list
  if (config.allowedPublicVars) {
    for (const varName of publicVars) {
      if (!config.allowedPublicVars.includes(varName)) {
        warnings.push(
          `Environment variable ${varName} is not in allowedPublicVars list. Consider adding it explicitly or removing NEXT_PUBLIC_ prefix.`,
        )
      }
    }
  }

  // Custom schema validation
  if (config.schema) {
    try {
      const envObject = Object.fromEntries(publicVars.map((key) => [key, process.env[key]]))
      config.schema.parse(envObject)
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(`Environment schema validation failed: ${error.message}`)
      } else {
        errors.push(
          `Environment schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    exposedVars,
  }
}

export function createEnvValidator(allowedVars: string[]) {
  return () => validateEnvironmentVariables({ allowedPublicVars: allowedVars })
}
