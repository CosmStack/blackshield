import type { Plugin } from 'vite'
import { validateEnvironmentVariables } from '../core/env-validator'

export interface BlackshieldViteOptions {
  /** Fail build on environment validation errors */
  failOnEnvErrors?: boolean
  /** Custom configuration */
  config?: {
    envValidation?: {
      allowedPublicVars?: string[]
    }
  }
}

export function blackshieldVite(options: BlackshieldViteOptions = {}): Plugin {
  return {
    name: 'blackshield',
    buildStart() {
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
    },
  }
} 