import { promises as fs } from 'node:fs'
import path from 'node:path'

const DEFAULT_CONFIG = {
  envValidation: {
    allowedPublicVars: ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_VERCEL_URL'],
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

const ESLINT_CONFIG = {
  extends: ['next/core-web-vitals'],
  plugins: ['@cosmstack/blackshield/eslint-plugin'],
  rules: {
    '@cosmstack/blackshield/no-public-sensitive-env': 'error',
    '@cosmstack/blackshield/no-unsafe-html': 'error',
  },
}

export async function initializeConfig(force = false) {
  const configPath = '.blackshieldrc.json'
  const eslintPath = '.eslintrc.blackshield.json'

  try {
    // Check if config already exists
    if (!force) {
      try {
        await fs.access(configPath)
        console.log('⚠️  Configuration file already exists. Use --force to overwrite.')
        return
      } catch {
        // File doesn't exist, continue
      }
    }

    // Write blackshield config
    await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
    console.log('✅ Created .blackshieldrc.json')

    // Write ESLint config example
    await fs.writeFile(eslintPath, JSON.stringify(ESLINT_CONFIG, null, 2), 'utf-8')
    console.log('✅ Created .eslintrc.blackshield.json (example ESLint config)')

    console.log('\n🛡️  Blackshield initialized successfully!')
    console.log('\nNext steps:')
    console.log('1. Review and customize .blackshieldrc.json')
    console.log('2. Merge .eslintrc.blackshield.json with your existing ESLint config')
    console.log('3. Run "npx @cosmstack/blackshield check" to analyze your project')
  } catch (error) {
    console.error('❌ Failed to initialize configuration:', error)
    process.exit(1)
  }
}
