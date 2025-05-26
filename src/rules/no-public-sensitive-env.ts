import { ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/cosmstack/blackshield/blob/main/docs/rules/${name}.md`,
)

// Patterns that indicate sensitive data
const SENSITIVE_PATTERNS = [
  /SECRET/i,
  /KEY/i,
  /TOKEN/i,
  /PASSWORD/i,
  /PRIVATE/i,
  /API_SECRET/i,
  /DATABASE/i,
  /DB_/i,
  /MONGO/i,
  /REDIS/i,
  /JWT/i,
  /AUTH/i,
  /STRIPE_SECRET/i,
  /PAYPAL/i,
  /WEBHOOK/i,
  /ENCRYPTION/i,
  /HASH/i,
  /SALT/i,
]

export const noPublicSensitiveEnv = createRule({
  name: 'no-public-sensitive-env',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent access to sensitive environment variables exposed through NEXT_PUBLIC_',
      recommended: 'recommended',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedVars: {
            type: 'array',
            items: { type: 'string' },
          },
          customPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      sensitivePublicEnv:
        'Accessing potentially sensitive environment variable "{{varName}}" that is exposed to client',
      suggestServerSide: 'Move this variable to server-side code or remove NEXT_PUBLIC_ prefix',
      suggestAllowList:
        'If this variable is safe to expose, add it to allowedVars in ESLint config',
    },
  },
  defaultOptions: [{ allowedVars: [] as string[], customPatterns: [] as string[] }],
  create(context, [options]) {
    const allowedVars: string[] = options.allowedVars || []
    const customPatterns: RegExp[] = (options.customPatterns || []).map((p) => new RegExp(p, 'i'))
    const allPatterns = [...SENSITIVE_PATTERNS, ...customPatterns]

    return {
      MemberExpression(node) {
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'process' &&
          node.object.property.type === 'Identifier' &&
          node.object.property.name === 'env' &&
          node.property.type === 'Identifier'
        ) {
          const varName = node.property.name

          // Only check NEXT_PUBLIC_ variables
          if (varName.startsWith('NEXT_PUBLIC_')) {
            // Skip if explicitly allowed
            if (allowedVars.includes(varName)) return

            // Check if it matches sensitive patterns
            const isSensitive = allPatterns.some((pattern) => pattern.test(varName))

            if (isSensitive) {
              context.report({
                node,
                messageId: 'sensitivePublicEnv',
                data: { varName },
                suggest: [
                  {
                    messageId: 'suggestServerSide',
                    fix(fixer) {
                      // Suggest removing NEXT_PUBLIC_ prefix
                      return fixer.replaceText(node.property, varName.replace('NEXT_PUBLIC_', ''))
                    },
                  },
                  {
                    messageId: 'suggestAllowList',
                    fix() {
                      // This would require modifying ESLint config, so no auto-fix
                      return null
                    },
                  },
                ],
              })
            }
          }
        }
      },
    }
  },
})
