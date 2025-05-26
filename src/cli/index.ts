import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { program } from 'commander'
import { scanEnvFiles } from '../core/env-audit.js'
import type { AnalysisResult, SecurityIssue } from '../types/index.js'
import { analyzeProject } from './analyzer.js'

// Get version from package.json
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJsonPath = join(__dirname, '../../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

program
  .name('blackshield')
  .description('Security analysis tool for React/Next.js applications')
  .version(packageJson.version)

program
  .command('check')
  .description('Analyze project for security issues')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .option('-f, --format <format>', 'Output format (json|table)', 'table')
  .option('--fix', 'Automatically fix issues where possible')
  .option('--config <config>', 'Path to blackshield config file')
  .action(async (options) => {
    try {
      const results = await analyzeProject(options.path, {
        format: options.format,
        fix: options.fix,
        configPath: options.config,
      })

      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2))
      } else {
        printTableResults(results)
      }

      // Exit with error code if issues found
      const hasErrors = results.issues.some((issue) => issue.severity === 'error')
      process.exit(hasErrors ? 1 : 0)
    } catch (error) {
      console.error('Error analyzing project:', error)
      process.exit(1)
    }
  })

program
  .command('scan-env')
  .description('Scan environment files for sensitive variables exposed to client')
  .option('-p, --path <path>', 'Project path to scan', process.cwd())
  .action(async (options) => {
    try {
      await scanEnvFiles(options.path)
    } catch (error) {
      console.error('Error scanning environment files:', error)
      process.exit(1)
    }
  })

program
  .command('init')
  .description('Initialize blackshield configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    const { initializeConfig } = await import('./init.js')
    await initializeConfig(options.force)
  })

function printTableResults(results: AnalysisResult) {
  console.log('\n🛡️  Blackshield Security Analysis\n')

  if (results.issues.length === 0) {
    console.log('✅ No security issues found!')
    return
  }

  const errors = results.issues.filter((i: SecurityIssue) => i.severity === 'error')
  const warnings = results.issues.filter((i: SecurityIssue) => i.severity === 'warning')

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s) found:`)
    for (const issue of errors) {
      console.log(`   ${issue.file}:${issue.line}:${issue.column} - ${issue.message}`)
      if (issue.suggestion) {
        console.log(`      💡 ${issue.suggestion}`)
      }
    }
    console.log()
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s) found:`)
    for (const issue of warnings) {
      console.log(`   ${issue.file}:${issue.line}:${issue.column} - ${issue.message}`)
      if (issue.suggestion) {
        console.log(`      💡 ${issue.suggestion}`)
      }
    }
    console.log()
  }

  console.log(`📊 Summary: ${errors.length} errors, ${warnings.length} warnings`)
}

program.parse()

export { program }
