import { noUnsafeEnv } from './no-unsafe-env'
import { noUnsafeHtml } from './no-unsafe-html'

export const rules = {
  'no-unsafe-env': noUnsafeEnv,
  'no-unsafe-html': noUnsafeHtml,
}

export const configs = {
  recommended: {
    plugins: ['@cosmstack/blackshield/eslint-plugin'],
    rules: {
      '@cosmstack/blackshield/no-unsafe-env': 'error',
      '@cosmstack/blackshield/no-unsafe-html': 'error',
    },
  },
}

// Default export for ESLint plugin
const plugin = {
  rules,
  configs,
}

export default plugin
