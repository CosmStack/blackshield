import { describe, expect, it } from 'vitest'
import { BIOME_CONFIGS, type BiomeConfigName } from '../configs'

describe('Biome Configs', () => {
  it('should define all expected configurations', () => {
    expect(BIOME_CONFIGS).toBeDefined()
    expect(Object.keys(BIOME_CONFIGS)).toHaveLength(2)
    expect(BIOME_CONFIGS.recommended).toBeDefined()
    expect(BIOME_CONFIGS.strict).toBeDefined()
  })

  it('should have correct recommended config structure', () => {
    const config = BIOME_CONFIGS.recommended

    expect(config.linter).toBeDefined()
    expect(config.linter.enabled).toBe(true)
    expect(config.linter.rules).toBeDefined()
    expect(config.linter.rules.security).toBeDefined()
    expect(config.linter.rules.blackshield).toBeDefined()
  })

  it('should disable noDangerouslySetInnerHtml in favor of our rule', () => {
    const recommendedConfig = BIOME_CONFIGS.recommended
    const strictConfig = BIOME_CONFIGS.strict

    expect(recommendedConfig.linter.rules.security.noDangerouslySetInnerHtml).toBe('off')
    expect(strictConfig.linter.rules.security.noDangerouslySetInnerHtml).toBe('off')
  })

  it('should enable blackshield rules in all configs', () => {
    const configs: BiomeConfigName[] = ['recommended', 'strict']

    for (const configName of configs) {
      const config = BIOME_CONFIGS[configName]
      expect(config.linter.rules.blackshield.noPublicSensitiveEnv).toBe('error')
      expect(config.linter.rules.blackshield.noUnsafeHtml).toBe('error')
    }
  })

  it('should have BiomeConfigName type working correctly', () => {
    const configNames: BiomeConfigName[] = ['recommended', 'strict']

    for (const configName of configNames) {
      expect(BIOME_CONFIGS[configName]).toBeDefined()
    }
  })
})
