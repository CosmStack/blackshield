import type { NextConfig } from 'next'
import { validateEnvironmentVariables } from '../core/env-validator'

export interface BlackshieldNextOptions {
  /** Fail build on environment validation errors */
  failOnEnvErrors?: boolean
  /** Custom configuration */
  config?: {
    envValidation?: {
      allowedPublicVars?: string[]
    }
  }
}

export function withBlackshield(
  nextConfig: NextConfig = {},
  options: BlackshieldNextOptions = {}
): NextConfig {
  return {
    ...nextConfig,
    webpack: (config, context) => {
      // Run environment validation during build
      if (context.isServer && context.buildId) {
        const validation = validateEnvironmentVariables(options.config?.envValidation)
        
        if (!validation.isValid) {
          console.error('\n🛡️  Blackshield: Environment validation failed!')
          validation.errors.forEach(error => {
            console.error(`❌ ${error}`)
          })
          
          if (options.failOnEnvErrors) {
            throw new Error('Build failed due to environment security issues')
          }
        }
        
        if (validation.warnings.length > 0) {
          console.warn('\n🛡️  Blackshield: Environment warnings:')
          validation.warnings.forEach(warning => {
            console.warn(`⚠️  ${warning}`)
          })
        }
      }

      // Call the original webpack function if it exists
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, context)
      }

      return config
    },
  }
} 