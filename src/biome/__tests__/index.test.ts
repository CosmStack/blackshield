import { describe, expect, it } from 'vitest'
import { BIOME_RULES, plugin } from '../index'

describe('Biome Plugin Index', () => {
  it('should export plugin with correct metadata', () => {
    expect(plugin).toBeDefined()
    expect(plugin.name).toBe('@cosmstack/blackshield/biome-plugin')
    expect(plugin.version).toBe('0.1.0')
    expect(plugin.description).toContain('Security rules for React/Next.js')
  })

  it('should export BIOME_RULES', () => {
    expect(BIOME_RULES).toBeDefined()
    expect(typeof BIOME_RULES).toBe('object')
  })

  it('should have plugin structure ready for future API', () => {
    expect(plugin.rules).toBeDefined()
    expect(plugin.configs).toBeDefined()
    expect(plugin.configs.recommended).toBeDefined()
  })
})
