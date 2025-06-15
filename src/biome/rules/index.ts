/**
 * Biome Security Rules Collection
 *
 * Currently implemented as GritQL patterns for Biome 2.0+
 * These rules mirror our ESLint rules but use Biome's syntax
 */

export const BIOME_RULES = {
  'no-public-sensitive-env': {
    description: 'Prevent access to sensitive environment variables exposed through NEXT_PUBLIC_',
    gritql: './gritql/no-public-sensitive-env.gql',
    severity: 'error',
  },
  'no-unsafe-html': {
    description: 'Prevent unsafe HTML injection vulnerabilities',
    gritql: './gritql/no-unsafe-html.gql',
    severity: 'error',
  },
} as const

export type BiomeRuleName = keyof typeof BIOME_RULES
