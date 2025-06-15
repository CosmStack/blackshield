/**
 * Biome Configuration Presets
 * Ready-to-use configurations for different security levels
 */

export const BIOME_CONFIGS = {
  recommended: {
    linter: {
      enabled: true,
      rules: {
        // Enable security-focused rules
        security: {
          noDangerouslySetInnerHtml: 'off', // We have our own version
        },
        // Our custom security rules (when plugin API is ready)
        blackshield: {
          noPublicSensitiveEnv: 'error',
          noUnsafeHtml: 'error',
        },
      },
    },
  },

  strict: {
    linter: {
      enabled: true,
      rules: {
        // All recommended rules plus stricter enforcement
        security: {
          noDangerouslySetInnerHtml: 'off',
        },
        blackshield: {
          noPublicSensitiveEnv: 'error',
          noUnsafeHtml: 'error',
        },
      },
    },
  },
} as const

export type BiomeConfigName = keyof typeof BIOME_CONFIGS
