import { noPublicSensitiveEnv } from './no-public-sensitive-env'
import { noUnsafeHtml } from './no-unsafe-html'

export const rules = {
  'no-unsafe-html': noUnsafeHtml,
  'no-public-sensitive-env': noPublicSensitiveEnv,
}

export const configs = {
  recommended: {
    plugins: ['@cosmstack/blackshield/eslint-plugin'],
    rules: {
      '@cosmstack/blackshield/no-unsafe-html': 'error',
      '@cosmstack/blackshield/no-public-sensitive-env': 'error',
    },
  },
}

// Default export for ESLint plugin
const plugin = {
  rules,
  configs,
}

export default plugin
