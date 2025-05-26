import { z } from 'zod'
import type { ServerInputValidation } from '../types'

export function validateServerInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): ServerInputValidation<T> {
  try {
    const data = schema.parse(input)
    return {
      data,
      errors: {},
      isValid: true,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}

      for (const issue of error.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(issue.message)
      }

      return {
        data: input as T,
        errors,
        isValid: false,
      }
    }

    return {
      data: input as T,
      errors: { _root: ['Validation failed'] },
      isValid: false,
    }
  }
}

export function createServerValidator<T>(schema: z.ZodSchema<T>) {
  return (input: unknown) => validateServerInput(schema, input)
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email(),
  password: z.string().min(8),
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  url: z.string().url(),
  safeString: z
    .string()
    .max(1000)
    .regex(/^[^<>]*$/), // No HTML tags
}
