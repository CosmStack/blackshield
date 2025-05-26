import { promises as fs } from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import type { EnvAuditResult } from '../types'

interface EnvAuditOptions {
  /** Project root path */
  projectPath?: string
  /** Additional sensitive patterns to check */
  customPatterns?: RegExp[]
  /** Variables that are explicitly allowed to be public */
  allowedPublicVars?: string[]
}

// Default patterns that indicate sensitive data
const DEFAULT_SENSITIVE_PATTERNS = [
  /SECRET/i,
  /KEY/i,
  /TOKEN/i,
  /PASSWORD/i,
  /PRIVATE/i,
  /API_SECRET/i,
  /DATABASE/i,
  /DB_/i,
  /MONGO/i,
  /REDIS/i,
  /JWT/i,
  /AUTH/i,
  /STRIPE_SECRET/i,
  /PAYPAL/i,
  /WEBHOOK/i,
  /ENCRYPTION/i,
  /HASH/i,
  /SALT/i,
]

export async function envAudit(options: EnvAuditOptions = {}): Promise<EnvAuditResult> {
  const { projectPath = process.cwd(), customPatterns = [], allowedPublicVars = [] } = options

  const sensitivePatterns = [...DEFAULT_SENSITIVE_PATTERNS, ...customPatterns]
  const sensitiveVars: EnvAuditResult['sensitiveVars'] = []
  const filesScanned: string[] = []
  let totalVars = 0

  try {
    // Find all .env files
    const envFiles = await glob('**/.env*', {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**'],
      dot: true,
    })

    for (const envFile of envFiles) {
      const filePath = path.join(projectPath, envFile)
      filesScanned.push(envFile)

      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          const trimmed = line.trim()

          // Skip comments and empty lines
          if (!trimmed || trimmed.startsWith('#')) return

          // Check for environment variable assignment
          const envMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/)
          if (!envMatch) return

          const varName = envMatch[1]
          totalVars++

          // Check if it's a NEXT_PUBLIC_ variable
          if (varName.startsWith('NEXT_PUBLIC_')) {
            // Skip if explicitly allowed
            if (allowedPublicVars.includes(varName)) return

            // Check if it matches sensitive patterns
            const isSensitive = sensitivePatterns.some((pattern) => pattern.test(varName))

            if (isSensitive) {
              sensitiveVars.push({
                name: varName,
                file: envFile,
                line: index + 1,
                severity: 'error',
                suggestion: `Remove NEXT_PUBLIC_ prefix or add "${varName}" to allowedPublicVars in config`,
              })
            } else {
              // Warn about potentially unnecessary public exposure
              sensitiveVars.push({
                name: varName,
                file: envFile,
                line: index + 1,
                severity: 'warning',
                suggestion: `Consider if "${varName}" needs to be public. If not, remove NEXT_PUBLIC_ prefix`,
              })
            }
          }
        })
      } catch (error) {
        console.warn(`Failed to read env file ${envFile}:`, error)
      }
    }
  } catch (error) {
    console.warn('Failed to scan for env files:', error)
  }

  return {
    isValid: sensitiveVars.filter((v) => v.severity === 'error').length === 0,
    sensitiveVars,
    summary: {
      totalVars,
      sensitiveCount: sensitiveVars.length,
      filesScanned,
    },
  }
}

// Utility function for CLI usage
export async function scanEnvFiles(projectPath?: string): Promise<void> {
  const result = await envAudit({ projectPath })

  console.log('\n🔍 Environment Variable Audit\n')

  if (result.sensitiveVars.length === 0) {
    console.log('✅ No sensitive environment variables found exposed to client!')
    console.log(
      `📊 Scanned ${result.summary.totalVars} variables in ${result.summary.filesScanned.length} files`,
    )
    return
  }

  const errors = result.sensitiveVars.filter((v) => v.severity === 'error')
  const warnings = result.sensitiveVars.filter((v) => v.severity === 'warning')

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} sensitive variable(s) exposed to client:`)
    for (const issue of errors) {
      console.log(`   ${issue.file}:${issue.line} - ${issue.name}`)
      console.log(`      💡 ${issue.suggestion}`)
    }
    console.log()
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} potentially unnecessary public variable(s):`)
    for (const issue of warnings) {
      console.log(`   ${issue.file}:${issue.line} - ${issue.name}`)
      console.log(`      💡 ${issue.suggestion}`)
    }
    console.log()
  }

  console.log(`📊 Summary: ${errors.length} errors, ${warnings.length} warnings`)
  console.log(`📁 Files scanned: ${result.summary.filesScanned.join(', ')}`)
}
