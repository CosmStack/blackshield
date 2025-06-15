/**
 * Biome Plugin Utilities
 * Helper functions for Biome plugin development
 */

import type { BiomeRuleName } from '../rules'

export interface BiomePluginOptions {
  rules?: Partial<Record<BiomeRuleName, 'error' | 'warn' | 'off'>>
  allowedPublicVars?: string[]
  customPatterns?: string[]
}

interface ESLintConfig {
  rules?: Record<string, unknown>
  settings?: {
    blackshield?: {
      allowedPublicVars?: string[]
    }
  }
}

type ESLintRuleValue = string | [string, ...unknown[]] | boolean | undefined | null

/**
 * Generate Biome configuration from Blackshield options
 */
export function generateBiomeConfig(options: BiomePluginOptions = {}) {
  const defaultRules = {
    'no-public-sensitive-env': 'error' as const,
    'no-unsafe-html': 'error' as const,
  }

  return {
    linter: {
      enabled: true,
      rules: {
        // Future: Map our rules to Biome's plugin system
        blackshield: {
          ...defaultRules,
          ...options.rules,
        },
      },
    },
  }
}

/**
 * Convert ESLint rule options to Biome format
 */
export function convertEslintToBiomeOptions(eslintConfig: ESLintConfig): BiomePluginOptions {
  const rules = eslintConfig.rules || {}

  const isRuleEnabled = (ruleValue: ESLintRuleValue): boolean => {
    if (!ruleValue) return false
    if (ruleValue === 'off') return false
    if (Array.isArray(ruleValue) && ruleValue[0] === 'off') return false
    return true
  }

  return {
    rules: {
      'no-public-sensitive-env': isRuleEnabled(
        rules['@cosmstack/blackshield/no-public-sensitive-env'] as ESLintRuleValue,
      )
        ? 'error'
        : 'off',
      'no-unsafe-html': isRuleEnabled(
        rules['@cosmstack/blackshield/no-unsafe-html'] as ESLintRuleValue,
      )
        ? 'error'
        : 'off',
    },
    allowedPublicVars: eslintConfig.settings?.blackshield?.allowedPublicVars || [],
  }
}
