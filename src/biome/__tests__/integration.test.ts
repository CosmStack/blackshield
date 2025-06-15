import { describe, expect, it } from 'vitest'
import { BIOME_CONFIGS } from '../configs'
import { plugin } from '../index'
import { BIOME_RULES } from '../rules'
import { convertEslintToBiomeOptions, generateBiomeConfig } from '../utils'

describe('Biome Plugin Integration', () => {
  it('should integrate all components correctly', () => {
    // Test that all exports work together
    expect(plugin).toBeDefined()
    expect(BIOME_RULES).toBeDefined()
    expect(BIOME_CONFIGS).toBeDefined()
    expect(generateBiomeConfig).toBeDefined()
    expect(convertEslintToBiomeOptions).toBeDefined()
  })

  it('should generate valid Biome config from recommended preset', () => {
    const config = generateBiomeConfig()
    const recommendedConfig = BIOME_CONFIGS.recommended

    // Both should have similar structure
    expect(config.linter.enabled).toBe(recommendedConfig.linter.enabled)
    expect(config.linter.rules).toBeDefined()
    expect(recommendedConfig.linter.rules).toBeDefined()
  })

  it('should convert ESLint to Biome config seamlessly', () => {
    const eslintConfig = {
      extends: ['next/core-web-vitals'],
      plugins: ['@cosmstack/blackshield/eslint-plugin'],
      rules: {
        '@cosmstack/blackshield/no-public-sensitive-env': 'error',
        '@cosmstack/blackshield/no-unsafe-html': 'error',
      },
      settings: {
        blackshield: {
          allowedPublicVars: ['NEXT_PUBLIC_APP_URL'],
        },
      },
    }

    const biomeOptions = convertEslintToBiomeOptions(eslintConfig)
    const biomeConfig = generateBiomeConfig(biomeOptions)

    const rules = biomeConfig.linter.rules.blackshield as Record<string, string>

    expect(biomeConfig.linter.enabled).toBe(true)
    expect(rules['no-public-sensitive-env']).toBe('error')
    expect(rules['no-unsafe-html']).toBe('error')
    expect(biomeOptions.allowedPublicVars).toContain('NEXT_PUBLIC_APP_URL')
  })

  it('should maintain consistency between rule names and configs', () => {
    const ruleNames = Object.keys(BIOME_RULES)
    const configRules = Object.keys(BIOME_CONFIGS.recommended.linter.rules.blackshield)

    // All rules should be represented in configs (when plugin API is ready)
    // For now, we check that the structure is consistent
    expect(ruleNames).toHaveLength(2)
    expect(configRules).toHaveLength(2)
  })

  it('should provide migration path from ESLint', () => {
    // Simulate a typical ESLint config migration
    const eslintConfig = {
      rules: {
        '@cosmstack/blackshield/no-public-sensitive-env': [
          'error',
          { allowedVars: ['NEXT_PUBLIC_APP_URL'] },
        ],
        '@cosmstack/blackshield/no-unsafe-html': 'warn',
      },
    }

    const biomeOptions = convertEslintToBiomeOptions(eslintConfig)

    const rules = biomeOptions.rules as Record<string, string>

    // Should preserve the intent even if some details are lost in conversion
    expect(rules['no-public-sensitive-env']).toBe('error')
    expect(rules['no-unsafe-html']).toBe('error') // warn -> error conversion
  })

  it('should be ready for future Biome plugin API', () => {
    // Test that the structure is ready for when Biome supports TypeScript plugins
    expect(plugin.name).toMatch(/@cosmstack\/blackshield\/biome-plugin/)
    expect(plugin.rules).toBeDefined()
    expect(plugin.configs).toBeDefined()
    expect(typeof plugin.version).toBe('string')
  })
})
