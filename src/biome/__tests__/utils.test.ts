import { describe, expect, it } from 'vitest'
import { type BiomePluginOptions, convertEslintToBiomeOptions, generateBiomeConfig } from '../utils'

describe('Biome Utils', () => {
  describe('generateBiomeConfig', () => {
    it('should generate default config when no options provided', () => {
      const config = generateBiomeConfig()

      const rules = config.linter.rules.blackshield as Record<string, string>

      expect(config.linter.enabled).toBe(true)
      expect(config.linter.rules.blackshield).toBeDefined()
      expect(rules['no-public-sensitive-env']).toBe('error')
      expect(rules['no-unsafe-html']).toBe('error')
    })

    it('should use provided rule options', () => {
      const options: BiomePluginOptions = {
        rules: {
          'no-public-sensitive-env': 'warn',
          'no-unsafe-html': 'off',
        },
      }

      const config = generateBiomeConfig(options)

      const rules = config.linter.rules.blackshield as Record<string, string>

      expect(rules['no-public-sensitive-env']).toBe('warn')
      expect(rules['no-unsafe-html']).toBe('off')
    })

    it('should handle partial rule options', () => {
      const options: BiomePluginOptions = {
        rules: {
          'no-public-sensitive-env': 'warn',
          // no-unsafe-html not specified, should use default
        },
      }

      const config = generateBiomeConfig(options)

      const rules = config.linter.rules.blackshield as Record<string, string>

      expect(rules['no-public-sensitive-env']).toBe('warn')
      expect(rules['no-unsafe-html']).toBe('error') // default
    })
  })

  describe('convertEslintToBiomeOptions', () => {
    it('should convert ESLint config with blackshield rules', () => {
      const eslintConfig = {
        rules: {
          '@cosmstack/blackshield/no-public-sensitive-env': 'error',
          '@cosmstack/blackshield/no-unsafe-html': 'warn',
        },
        settings: {
          blackshield: {
            allowedPublicVars: ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL'],
          },
        },
      }

      const biomeOptions = convertEslintToBiomeOptions(eslintConfig)

      const rules = biomeOptions.rules as Record<string, string>

      expect(biomeOptions.rules).toBeDefined()
      expect(rules['no-public-sensitive-env']).toBe('error')
      expect(rules['no-unsafe-html']).toBe('error') // warn becomes error
      expect(biomeOptions.allowedPublicVars).toEqual(['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL'])
    })

    it('should handle ESLint config without blackshield rules', () => {
      const eslintConfig = {
        rules: {
          'no-console': 'warn',
        },
      }

      const biomeOptions = convertEslintToBiomeOptions(eslintConfig)

      const rules = biomeOptions.rules as Record<string, string>

      expect(rules['no-public-sensitive-env']).toBe('off')
      expect(rules['no-unsafe-html']).toBe('off')
      expect(biomeOptions.allowedPublicVars).toEqual([])
    })

    it('should handle empty ESLint config', () => {
      const eslintConfig = {}

      const biomeOptions = convertEslintToBiomeOptions(eslintConfig)

      const rules = biomeOptions.rules as Record<string, string>

      expect(biomeOptions.rules).toBeDefined()
      expect(rules['no-public-sensitive-env']).toBe('off')
      expect(rules['no-unsafe-html']).toBe('off')
      expect(biomeOptions.allowedPublicVars).toEqual([])
    })

    it('should handle ESLint config with different rule values', () => {
      const eslintConfig = {
        rules: {
          '@cosmstack/blackshield/no-public-sensitive-env': [
            'error',
            { allowedVars: ['NEXT_PUBLIC_APP_URL'] },
          ],
          '@cosmstack/blackshield/no-unsafe-html': 'off',
        },
      }

      const biomeOptions = convertEslintToBiomeOptions(eslintConfig)

      const rules = biomeOptions.rules as Record<string, string>

      expect(rules['no-public-sensitive-env']).toBe('error')
      expect(rules['no-unsafe-html']).toBe('off')
    })

    it('should handle missing settings', () => {
      const eslintConfig = {
        rules: {
          '@cosmstack/blackshield/no-public-sensitive-env': 'error',
        },
        // no settings
      }

      const biomeOptions = convertEslintToBiomeOptions(eslintConfig)

      expect(biomeOptions.allowedPublicVars).toEqual([])
    })
  })

  describe('BiomePluginOptions interface', () => {
    it('should accept valid options', () => {
      const options: BiomePluginOptions = {
        rules: {
          'no-public-sensitive-env': 'error',
          'no-unsafe-html': 'warn',
        },
        allowedPublicVars: ['NEXT_PUBLIC_APP_URL'],
        customPatterns: ['CUSTOM_.*'],
      }

      expect(options.rules).toBeDefined()
      expect(options.allowedPublicVars).toHaveLength(1)
      expect(options.customPatterns).toHaveLength(1)
    })

    it('should work with partial options', () => {
      const options: BiomePluginOptions = {
        rules: {
          'no-public-sensitive-env': 'error',
          // no-unsafe-html omitted
        },
      }

      const rules = options.rules as Record<string, string>

      expect(rules['no-public-sensitive-env']).toBe('error')
      expect(rules['no-unsafe-html']).toBeUndefined()
    })
  })
})
