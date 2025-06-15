import { ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/cosmstack/blackshield/blob/main/docs/rules/${name}.md`,
)

export const noUnsafeHtml = createRule({
  name: 'no-unsafe-html',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent unsafe HTML injection vulnerabilities',
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsafeHtml:
        'Using dangerouslySetInnerHTML without sanitization can lead to XSS vulnerabilities',
      suggestSafeHtml: 'Use SafeHTML component from @cosmstack/blackshield instead',
      unsafeInnerHtml: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type === 'JSXIdentifier' && node.name.name === 'dangerouslySetInnerHTML') {
          context.report({
            node,
            messageId: 'unsafeHtml',
            suggest: [
              {
                messageId: 'suggestSafeHtml',
                fix(fixer) {
                  return fixer.replaceText(node.name, 'html')
                },
              },
            ],
          })
        }
      },
      AssignmentExpression(node) {
        if (
          node.left.type === 'MemberExpression' &&
          node.left.property.type === 'Identifier' &&
          node.left.property.name === 'innerHTML'
        ) {
          context.report({
            node,
            messageId: 'unsafeInnerHtml',
          })
        }
      },
    }
  },
})
