/**
 * Blackshield Biome Plugin
 * Security rules for Biome linter
 *
 * This module provides both:
 * 1. GritQL-based rules for Biome 2.0+ (beta feature)
 * 2. Plugin structure for future TypeScript-based plugin API
 */

// Re-export rules for easy access
export * from './rules'
export * from './configs'
export * from './utils'

// Plugin metadata
export const plugin = {
  name: '@cosmstack/blackshield/biome-plugin',
  version: '0.1.0',
  description: 'Security rules for React/Next.js applications using Biome',
  rules: {
    // Future plugin API will populate these
    // For now, users should use GritQL files directly
  },
  configs: {
    recommended: {
      // Future: Biome config integration
    },
  },
}

export default plugin
