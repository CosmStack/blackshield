import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { commonSchemas, createServerValidator, validateServerInput } from '../validation'

describe('validateServerInput', () => {
  const testSchema = z.object({
    email: z.string().email(),
    age: z.number().min(18),
    name: z.string().min(1),
  })

  it('should validate correct input', () => {
    const input = {
      email: 'test@example.com',
      age: 25,
      name: 'John Doe',
    }

    const result = validateServerInput(testSchema, input)

    expect(result.isValid).toBe(true)
    expect(result.data).toEqual(input)
    expect(result.errors).toEqual({})
  })

  it('should return errors for invalid input', () => {
    const input = {
      email: 'invalid-email',
      age: 16,
      name: '',
    }

    const result = validateServerInput(testSchema, input)

    expect(result.isValid).toBe(false)
    expect(result.data).toEqual(input)
    expect(result.errors).toHaveProperty('email')
    expect(result.errors).toHaveProperty('age')
    expect(result.errors).toHaveProperty('name')
  })

  it('should handle missing fields', () => {
    const input = {
      email: 'test@example.com',
      // missing age and name
    }

    const result = validateServerInput(testSchema, input)

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveProperty('age')
    expect(result.errors).toHaveProperty('name')
  })

  it('should handle null/undefined input', () => {
    const result = validateServerInput(testSchema, null)

    expect(result.isValid).toBe(false)
    expect(result.data).toBeNull()
  })
})

describe('createServerValidator', () => {
  it('should create a reusable validator function', () => {
    const schema = z.object({
      username: z.string().min(3),
    })

    const validator = createServerValidator(schema)

    const validResult = validator({ username: 'john' })
    expect(validResult.isValid).toBe(true)

    const invalidResult = validator({ username: 'jo' })
    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors).toHaveProperty('username')
  })
})

describe('commonSchemas', () => {
  it('should provide email schema', () => {
    expect(commonSchemas.email.safeParse('test@example.com').success).toBe(true)
    expect(commonSchemas.email.safeParse('invalid').success).toBe(false)
  })

  it('should provide password schema', () => {
    expect(commonSchemas.password.safeParse('password123').success).toBe(true)
    expect(commonSchemas.password.safeParse('short').success).toBe(false)
  })

  it('should provide id schema', () => {
    expect(commonSchemas.id.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
    expect(commonSchemas.id.safeParse('123').success).toBe(false)
    expect(commonSchemas.id.safeParse('').success).toBe(false)
  })
})
