import { promises as fs } from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import type { AnalysisResult, BlackshieldConfig, SecurityIssue } from '../types'

interface AnalyzeOptions {
  format?: 'json' | 'table'
  fix?: boolean
  configPath?: string
}

export async function analyzeProject(
  projectPath: string,
  options: AnalyzeOptions = {},
): Promise<AnalysisResult> {
  const issues: SecurityIssue[] = []

  // Load config
  const config = await loadConfig(projectPath, options.configPath)

  // Analyze different aspects
  const envIssues = await analyzeEnvironmentVariables(projectPath, config)
  const xssIssues = await analyzeXSSVulnerabilities(projectPath, config)
  const boundaryIssues = await analyzeBoundaryViolations(projectPath, config)
  const serverIssues = await analyzeServerSecurity(projectPath, config)

  issues.push(...envIssues, ...xssIssues, ...boundaryIssues, ...serverIssues)

  return {
    projectPath,
    timestamp: new Date().toISOString(),
    issues,
    summary: {
      total: issues.length,
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    },
    config,
  }
}

async function loadConfig(projectPath: string, configPath?: string): Promise<BlackshieldConfig> {
  const configFile = configPath || path.join(projectPath, '.blackshieldrc.json')

  try {
    await fs.access(configFile)
    const content = await fs.readFile(configFile, 'utf-8')
    return JSON.parse(content)
  } catch {
    // Return default config if no config file found
    return {
      envValidation: {
        allowedPublicVars: ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL'],
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
  }
}

async function analyzeEnvironmentVariables(
  projectPath: string,
  config: BlackshieldConfig,
): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []

  try {
    // Find environment files
    const envFiles = await glob('**/.env*', {
      cwd: projectPath,
      ignore: ['node_modules/**', '.git/**'],
    })

    for (const envFile of envFiles) {
      const filePath = path.join(projectPath, envFile)
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('NEXT_PUBLIC_') && trimmed.includes('=')) {
          const [varName] = trimmed.split('=')
          const cleanVarName = varName.trim()

          // Check if this variable is in the allowed list
          const allowedVars = config.envValidation?.allowedPublicVars || []
          if (!allowedVars.includes(cleanVarName)) {
            // Check for potentially sensitive patterns
            const sensitivePatterns = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE']
            const isSensitive = sensitivePatterns.some((pattern) =>
              cleanVarName.toUpperCase().includes(pattern),
            )

            issues.push({
              type: 'env-exposure',
              severity: isSensitive ? 'error' : 'warning',
              file: envFile,
              line: index + 1,
              column: 1,
              message: `Potentially sensitive environment variable "${cleanVarName}" exposed to client`,
              suggestion: isSensitive
                ? 'Remove NEXT_PUBLIC_ prefix or add to allowedPublicVars in config'
                : `Consider if "${cleanVarName}" should be public`,
            })
          }
        }
      })
    }
  } catch (error) {
    console.warn('Failed to analyze environment variables:', error)
  }

  return issues
}

async function analyzeXSSVulnerabilities(
  projectPath: string,
  config: BlackshieldConfig,
): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []

  try {
    // Find all TypeScript/JavaScript files
    const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.*', '**/*.spec.*'],
    })

    for (const file of sourceFiles) {
      const filePath = path.join(projectPath, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        // Check for dangerouslySetInnerHTML
        if (line.includes('dangerouslySetInnerHTML')) {
          issues.push({
            type: 'xss-vulnerability',
            severity: 'error',
            message: 'Use of dangerouslySetInnerHTML can lead to XSS vulnerabilities',
            file,
            line: index + 1,
            column: line.indexOf('dangerouslySetInnerHTML') + 1,
            suggestion: 'Use SafeHTML component from @cosmstack/blackshield instead',
          })
        }

        // Check for innerHTML assignments
        if (line.includes('.innerHTML =')) {
          issues.push({
            type: 'xss-vulnerability',
            severity: 'error',
            message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
            file,
            line: index + 1,
            column: line.indexOf('.innerHTML') + 1,
            suggestion: 'Use SafeHTML component or sanitizeHTML function',
          })
        }
      })
    }
  } catch (error) {
    console.warn('Could not analyze XSS vulnerabilities:', error)
  }

  return issues
}

async function analyzeBoundaryViolations(
  projectPath: string,
  config: BlackshieldConfig,
): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []

  try {
    // Check for unprotected API routes
    const apiFiles = await glob('**/api/**/*.{ts,js}', {
      cwd: projectPath,
      ignore: ['**/node_modules/**'],
    })

    for (const file of apiFiles) {
      const filePath = path.join(projectPath, file)
      const content = await fs.readFile(filePath, 'utf-8')

      // Check if API route uses any protection
      const hasProtection =
        content.includes('protect(') ||
        content.includes('requireAuth') ||
        content.includes('validateServerInput')

      if (!hasProtection) {
        issues.push({
          type: 'boundary-violation',
          severity: 'warning',
          message: 'API route appears to have no security protection',
          file,
          line: 1,
          column: 1,
          suggestion: 'Consider using protect() middleware from @cosmstack/blackshield/server',
        })
      }
    }

    // Check for server actions without protection
    const serverFiles = await glob('**/app/**/*.{ts,tsx}', {
      cwd: projectPath,
      ignore: ['**/node_modules/**'],
    })

    for (const file of serverFiles) {
      const filePath = path.join(projectPath, file)
      const content = await fs.readFile(filePath, 'utf-8')

      // Look for server actions (functions with 'use server')
      if (content.includes("'use server'") || content.includes('"use server"')) {
        const hasProtection =
          content.includes('protectServerAction') || content.includes('validateServerInput')

        if (!hasProtection) {
          issues.push({
            type: 'boundary-violation',
            severity: 'warning',
            message: 'Server action appears to have no security protection',
            file,
            line: 1,
            column: 1,
            suggestion: 'Consider using protectServerAction() from @cosmstack/blackshield/server',
          })
        }
      }
    }
  } catch (error) {
    console.warn('Could not analyze boundary violations:', error)
  }

  return issues
}

async function analyzeServerSecurity(
  projectPath: string,
  config: BlackshieldConfig,
): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = []

  try {
    // Check for server actions without protection
    const serverFiles = await glob('**/app/**/*.{ts,tsx}', {
      cwd: projectPath,
      ignore: ['**/node_modules/**'],
    })

    for (const file of serverFiles) {
      const filePath = path.join(projectPath, file)
      const content = await fs.readFile(filePath, 'utf-8')

      // Look for server actions (functions with 'use server')
      if (content.includes("'use server'") || content.includes('"use server"')) {
        const hasProtection =
          content.includes('protectServerAction') || content.includes('validateServerInput')

        if (!hasProtection) {
          issues.push({
            type: 'boundary-violation',
            severity: 'warning',
            message: 'Server action appears to have no security protection',
            file,
            line: 1,
            column: 1,
            suggestion: 'Consider using protectServerAction() from @cosmstack/blackshield/server',
          })
        }
      }
    }
  } catch (error) {
    console.warn('Could not analyze server security:', error)
  }

  return issues
}
