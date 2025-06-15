import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('GritQL Rules', () => {
  const gritqlDir = join(__dirname, '../rules/gritql')

  describe('no-public-sensitive-env.gql', () => {
    it('should exist and be readable', () => {
      const rulePath = join(gritqlDir, 'no-public-sensitive-env.gql')

      expect(() => {
        const content = readFileSync(rulePath, 'utf-8')
        expect(content).toContain('pattern sensitive_public_env()')
        expect(content).toContain('NEXT_PUBLIC_')
        expect(content).toContain('SECRET|KEY|TOKEN|PASSWORD')
      }).not.toThrow()
    })

    it('should have proper GritQL syntax structure', () => {
      const rulePath = join(gritqlDir, 'no-public-sensitive-env.gql')
      const content = readFileSync(rulePath, 'utf-8')

      // Check for required GritQL elements
      expect(content).toContain('language js')
      expect(content).toContain('pattern')
      expect(content).toContain('member_expression')
      expect(content).toContain('error(')
    })

    it('should include sensitive patterns in regex', () => {
      const rulePath = join(gritqlDir, 'no-public-sensitive-env.gql')
      const content = readFileSync(rulePath, 'utf-8')

      const sensitivePatterns = [
        'SECRET',
        'KEY',
        'TOKEN',
        'PASSWORD',
        'PRIVATE',
        'DATABASE',
        'MONGO',
        'REDIS',
        'JWT',
        'AUTH',
      ]

      for (const pattern of sensitivePatterns) {
        expect(content).toContain(pattern)
      }
    })
  })

  describe('no-unsafe-html.gql', () => {
    it('should exist and be readable', () => {
      const rulePath = join(gritqlDir, 'no-unsafe-html.gql')

      expect(() => {
        const content = readFileSync(rulePath, 'utf-8')
        expect(content).toContain('dangerouslySetInnerHTML')
        expect(content).toContain('innerHTML')
        expect(content).toContain('XSS vulnerabilities')
      }).not.toThrow()
    })

    it('should have proper GritQL syntax structure', () => {
      const rulePath = join(gritqlDir, 'no-unsafe-html.gql')
      const content = readFileSync(rulePath, 'utf-8')

      // Check for required GritQL elements
      expect(content).toContain('language js')
      expect(content).toContain('jsx_attribute')
      expect(content).toContain('assignment_expression')
      expect(content).toContain('error(')
    })

    it('should target both JSX and DOM innerHTML', () => {
      const rulePath = join(gritqlDir, 'no-unsafe-html.gql')
      const content = readFileSync(rulePath, 'utf-8')

      expect(content).toContain('dangerouslySetInnerHTML')
      expect(content).toContain('innerHTML')
      expect(content).toContain('SafeHTML component')
    })
  })

  describe('GritQL files structure', () => {
    it('should have comments explaining usage', () => {
      const files = ['no-public-sensitive-env.gql', 'no-unsafe-html.gql']

      for (const filename of files) {
        const rulePath = join(gritqlDir, filename)
        const content = readFileSync(rulePath, 'utf-8')

        expect(content).toContain('/*')
        expect(content).toContain('biome.json')
        expect(content).toContain('Usage')
      }
    })

    it('should include proper error messages', () => {
      const files = ['no-public-sensitive-env.gql', 'no-unsafe-html.gql']

      for (const filename of files) {
        const rulePath = join(gritqlDir, filename)
        const content = readFileSync(rulePath, 'utf-8')

        expect(content).toContain('error(')
        expect(content).toMatch(/error\([^)]+\)/)
      }
    })
  })
})
