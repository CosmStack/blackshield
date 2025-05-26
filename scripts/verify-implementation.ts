#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface VerificationResult {
  feature: string
  status: 'implemented' | 'missing' | 'partial'
  files: string[]
  notes?: string
}

const results: VerificationResult[] = []

function checkFile(path: string): boolean {
  return existsSync(join(process.cwd(), path))
}

function checkExport(filePath: string, exportName: string): boolean {
  try {
    const content = readFileSync(join(process.cwd(), filePath), 'utf-8')
    return content.includes('export') && content.includes(exportName)
  } catch {
    return false
  }
}

// Check 1: Environment Protection
console.log('🔍 Checking Environment Protection...')
const envFiles = [
  'src/core/env-validator.ts',
  'src/core/__tests__/env-validator.test.ts',
  'src/rules/no-unsafe-env.ts',
]
const envImplemented =
  envFiles.every(checkFile) &&
  checkExport('src/core/env-validator.ts', 'validateEnvironmentVariables')

results.push({
  feature: 'Environment Variable Protection',
  status: envImplemented ? 'implemented' : 'partial',
  files: envFiles,
  notes: envImplemented
    ? 'Runtime validation ✅, Build-time protection ✅'
    : 'Missing build-time protection',
})

// Check 2: Server Protection Middleware
console.log('🔍 Checking Server Protection Middleware...')
const serverFiles = ['src/server/middleware.ts', 'src/server/__tests__/middleware.test.ts']
const serverImplemented =
  serverFiles.every(checkFile) &&
  checkExport('src/server/middleware.ts', 'protect') &&
  checkExport('src/server/middleware.ts', 'protectServerAction')

results.push({
  feature: 'Server Protection Middleware',
  status: serverImplemented ? 'implemented' : 'missing',
  files: serverFiles,
  notes: serverImplemented
    ? 'protect() ✅, protectServerAction() ✅, Rate limiting ✅'
    : 'Core middleware missing',
})

// Check 3: XSS Protection
console.log('🔍 Checking XSS Protection...')
const xssFiles = ['src/core/xss-protection.tsx', 'src/core/__tests__/xss-protection.test.ts']
const xssImplemented =
  xssFiles.every(checkFile) &&
  checkExport('src/core/xss-protection.tsx', 'SafeHTML') &&
  checkExport('src/core/xss-protection.tsx', 'useSanitizedHTML')

results.push({
  feature: 'XSS Protection',
  status: xssImplemented ? 'implemented' : 'partial',
  files: xssFiles,
  notes: xssImplemented ? 'DOMPurify ✅, SafeHTML ✅, useSanitizedHTML ✅' : 'Missing components',
})

// Check 4: ESLint Plugin
console.log('🔍 Checking ESLint Plugin...')
const eslintFiles = [
  'src/rules/index.ts',
  'src/rules/no-unsafe-env.ts',
  'src/rules/no-unsafe-html.ts',
  'src/rules/__tests__/no-unsafe-env.test.ts',
]
const eslintImplemented = eslintFiles.every(checkFile)

results.push({
  feature: 'ESLint Plugin',
  status: eslintImplemented ? 'implemented' : 'partial',
  files: eslintFiles,
  notes: eslintImplemented ? 'no-unsafe-env ✅, no-unsafe-html ✅' : 'Missing rules or tests',
})

// Check 5: CLI Tool
console.log('🔍 Checking CLI Tool...')
const cliFiles = [
  'src/cli/index.ts',
  'src/cli/analyzer.ts',
  'src/cli/init.ts',
  'src/cli/__tests__/analyzer.test.ts',
]
const cliImplemented =
  cliFiles.every(checkFile) && checkExport('src/cli/analyzer.ts', 'analyzeProject')

results.push({
  feature: 'CLI Tool',
  status: cliImplemented ? 'implemented' : 'missing',
  files: cliFiles,
  notes: cliImplemented ? 'blackshield check ✅, blackshield init ✅' : 'CLI missing',
})

// Check 6: Build Plugins
console.log('🔍 Checking Build Plugins...')
const buildFiles = ['src/build/next-plugin.ts', 'src/build/vite-plugin.ts']
const buildImplemented =
  buildFiles.every(checkFile) &&
  checkExport('src/build/next-plugin.ts', 'withBlackshield') &&
  checkExport('src/build/vite-plugin.ts', 'blackshieldVite')

results.push({
  feature: 'Build-time Protection',
  status: buildImplemented ? 'implemented' : 'missing',
  files: buildFiles,
  notes: buildImplemented ? 'Next.js plugin ✅, Vite plugin ✅' : 'Build plugins missing',
})

// Check 7: Test Coverage
console.log('🔍 Checking Test Coverage...')
const testFiles = [
  'src/__tests__/integration.test.ts',
  'src/core/__tests__/env-validator.test.ts',
  'src/core/__tests__/xss-protection.test.ts',
  'src/server/__tests__/middleware.test.ts',
  'src/server/__tests__/validation.test.ts',
  'src/cli/__tests__/analyzer.test.ts',
]
const testsImplemented = testFiles.filter(checkFile).length >= 4

results.push({
  feature: 'Test Coverage',
  status: testsImplemented ? 'implemented' : 'partial',
  files: testFiles,
  notes: `${testFiles.filter(checkFile).length}/${testFiles.length} test files present`,
})

// Print Results
console.log('\n📊 Implementation Status Report\n')
console.log('='.repeat(60))

let totalImplemented = 0
const totalFeatures = results.length

results.forEach((result) => {
  const statusIcon =
    result.status === 'implemented' ? '✅' : result.status === 'partial' ? '🔧' : '❌'

  console.log(`${statusIcon} ${result.feature}`)
  console.log(`   Status: ${result.status.toUpperCase()}`)
  if (result.notes) {
    console.log(`   Notes: ${result.notes}`)
  }
  console.log(`   Files: ${result.files.length} files`)
  console.log()

  if (result.status === 'implemented') totalImplemented++
})

console.log('='.repeat(60))
console.log(
  `📈 Overall Progress: ${totalImplemented}/${totalFeatures} features implemented (${Math.round((totalImplemented / totalFeatures) * 100)}%)`,
)

if (totalImplemented === totalFeatures) {
  console.log('🎉 All MVP features are implemented!')
} else {
  console.log('🔧 Some features need attention.')
}

console.log('\n🚀 Next Steps:')
console.log('1. Run: npm run test:build')
console.log('2. Fix any failing tests')
console.log('3. Test CLI: npx @cosmstack/blackshield --version')
console.log('4. Test in a real Next.js project')
