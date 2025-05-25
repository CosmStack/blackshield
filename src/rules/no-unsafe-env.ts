import { ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/cosmstack/blackshield/blob/main/docs/rules/${name}.md`,
)

export const noUnsafeEnv = createRule({
  name: 'no-unsafe-env',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent exposure of sensitive environment variables',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unsafeEnv:
        'Potentially sensitive environment variable "{{varName}}" should not be exposed to client',
      suggestServerSide:
        'Consider moving this to server-side code or use a different variable name',
    },
  },
  defaultOptions: [{ allowedVars: [] as string[] }],
  create(context, [options]) {
    const allowedVars: string[] = options.allowedVars || []
    const dangerousPatterns: RegExp[] = [
      /SECRET/i,
      /KEY/i,
      /TOKEN/i,
      /PASSWORD/i,
      /PRIVATE/i,
      /API_SECRET/i,
      /DATABASE/i,
    ]

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

          if (varName.startsWith('NEXT_PUBLIC_')) {
            const isDangerous = dangerousPatterns.some((pattern) => pattern.test(varName))
            const isAllowed = allowedVars.includes(varName)

            if (isDangerous && !isAllowed) {
              context.report({
                node,
                messageId: 'unsafeEnv',
                data: { varName },
                suggest: [
                  {
                    messageId: 'suggestServerSide',
                    fix(fixer) {
                      return fixer.replaceText(node.property, varName.replace('NEXT_PUBLIC_', ''))
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
