import { describe, expect, it } from 'vitest'
import { BIOME_RULES, type BiomeRuleName } from '../rules'

describe('Biome Rules', () => {
  it('should define all expected rules', () => {
    expect(BIOME_RULES).toBeDefined()
    expect(Object.keys(BIOME_RULES)).toHaveLength(2)
    expect(BIOME_RULES['no-public-sensitive-env']).toBeDefined()
    expect(BIOME_RULES['no-unsafe-html']).toBeDefined()
  })

  it('should have correct rule structure for no-public-sensitive-env', () => {
    const rule = BIOME_RULES['no-public-sensitive-env']

    expect(rule.description).toContain('sensitive environment variables')
    expect(rule.gritql).toBe('./gritql/no-public-sensitive-env.gql')
    expect(rule.severity).toBe('error')
  })

  it('should have correct rule structure for no-unsafe-html', () => {
    const rule = BIOME_RULES['no-unsafe-html']

    expect(rule.description).toContain('unsafe HTML injection')
    expect(rule.gritql).toBe('./gritql/no-unsafe-html.gql')
    expect(rule.severity).toBe('error')
  })

  it('should have correct BiomeRuleName type', () => {
    const ruleNames: BiomeRuleName[] = ['no-public-sensitive-env', 'no-unsafe-html']

    for (const ruleName of ruleNames) {
      expect(BIOME_RULES[ruleName]).toBeDefined()
    }
  })

  it('should use kebab-case for rule names', () => {
    const ruleNames = Object.keys(BIOME_RULES)

    for (const ruleName of ruleNames) {
      expect(ruleName).toMatch(/^[a-z]+(-[a-z]+)*$/)
      expect(ruleName).not.toMatch(/[A-Z]/) // No camelCase
    }
  })
})
