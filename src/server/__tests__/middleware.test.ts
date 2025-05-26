import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import * as cookies from '../cookies'
import { protect, protectServerAction } from '../middleware'

// Mock cookies module
vi.mock('../cookies', () => ({
  readSecureCookie: vi.fn(),
}))

// Mock Next.js
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data: any, init?: any) => ({
      data,
      init,
      status: init?.status || 200,
    })),
  },
}))

describe('protect middleware', () => {
  const mockHandler = vi.fn()
  const mockReadSecureCookie = vi.mocked(cookies.readSecureCookie)

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandler.mockResolvedValue({ data: { success: true }, status: 200 })
  })

  it('should allow requests without protection options', async () => {
    const protectedHandler = protect(mockHandler)
    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: { get: vi.fn() },
    } as any

    await protectedHandler(mockReq)

    expect(mockHandler).toHaveBeenCalledWith(
      mockReq,
      { user: null, validatedInput: undefined },
      undefined,
    )
  })

  it('should enforce authentication when requireAuth is true', async () => {
    mockReadSecureCookie.mockResolvedValue(null)

    const protectedHandler = protect(mockHandler, { requireAuth: true })
    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: { get: vi.fn() },
    } as any

    const result = await protectedHandler(mockReq)

    expect(result).toEqual({
      data: { error: 'Authentication required' },
      init: { status: 401 },
      status: 401,
    })
    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('should allow authenticated requests', async () => {
    const mockUser = { id: '123', roles: ['user'], permissions: ['read'] }
    mockReadSecureCookie.mockResolvedValue(mockUser)

    const protectedHandler = protect(mockHandler, { requireAuth: true })
    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: { get: vi.fn() },
    } as any

    await protectedHandler(mockReq)

    expect(mockHandler).toHaveBeenCalledWith(
      mockReq,
      { user: mockUser, validatedInput: undefined },
      undefined,
    )
  })

  it('should enforce role-based authorization', async () => {
    const mockUser = { id: '123', roles: ['user'], permissions: ['read'] }
    mockReadSecureCookie.mockResolvedValue(mockUser)

    const protectedHandler = protect(mockHandler, { roles: ['admin'] })
    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: { get: vi.fn() },
    } as any

    const result = await protectedHandler(mockReq)

    expect(result).toEqual({
      data: { error: 'Insufficient permissions' },
      init: { status: 403 },
      status: 403,
    })
  })

  it('should allow users with required roles', async () => {
    const mockUser = { id: '123', roles: ['admin'], permissions: ['read'] }
    mockReadSecureCookie.mockResolvedValue(mockUser)

    const protectedHandler = protect(mockHandler, { roles: ['admin'] })
    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: { get: vi.fn() },
    } as any

    await protectedHandler(mockReq)

    expect(mockHandler).toHaveBeenCalledWith(
      mockReq,
      { user: mockUser, validatedInput: undefined },
      undefined,
    )
  })

  it('should enforce permission-based authorization', async () => {
    const mockUser = { id: '123', roles: ['user'], permissions: ['read'] }
    mockReadSecureCookie.mockResolvedValue(mockUser)

    const protectedHandler = protect(mockHandler, { permissions: ['write'] })
    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: { get: vi.fn() },
    } as any

    const result = await protectedHandler(mockReq)

    expect(result).toEqual({
      data: { error: 'Insufficient permissions' },
      init: { status: 403 },
      status: 403,
    })
  })

  it('should validate input with schema', async () => {
    const schema = z.object({ name: z.string(), age: z.number() })
    const protectedHandler = protect(mockHandler, { schemaValidation: schema })

    const mockReq = {
      method: 'POST',
      url: 'http://localhost/api/test',
      headers: {
        get: vi.fn().mockReturnValue('application/json'),
      },
      json: vi.fn().mockResolvedValue({ name: 'John', age: 'invalid' }),
    } as any

    const result = await protectedHandler(mockReq)

    expect(result).toEqual({
      data: { error: 'Validation failed', details: expect.any(Object) },
      init: { status: 400 },
      status: 400,
    })
  })

  it('should enforce rate limiting', async () => {
    const protectedHandler = protect(mockHandler, {
      rateLimit: { max: 1, windowSeconds: 60 },
    })

    const mockReq = {
      method: 'GET',
      url: 'http://localhost/api/test',
      ip: '127.0.0.1',
      headers: { get: vi.fn() },
    } as any

    // First request should succeed
    await protectedHandler(mockReq)
    expect(mockHandler).toHaveBeenCalledTimes(1)

    // Second request should be rate limited
    const result = await protectedHandler(mockReq)
    expect(result).toEqual({
      data: { error: 'Rate limit exceeded' },
      init: { status: 429 },
      status: 429,
    })
  })
})

describe('protectServerAction', () => {
  const mockAction = vi.fn()
  const mockReadSecureCookie = vi.mocked(cookies.readSecureCookie)

  beforeEach(() => {
    vi.clearAllMocks()
    mockAction.mockResolvedValue({ success: true })
  })

  it('should allow actions without protection options', async () => {
    const protectedAction = protectServerAction(mockAction)

    const result = await protectedAction('test')

    expect(result).toEqual({ success: true })
    expect(mockAction).toHaveBeenCalledWith('test')
  })

  it('should enforce authentication for server actions', async () => {
    mockReadSecureCookie.mockResolvedValue(null)

    const protectedAction = protectServerAction(mockAction, { requireAuth: true })

    const result = await protectedAction('test')

    expect(result).toEqual({ error: 'Authentication required', status: 401 })
    expect(mockAction).not.toHaveBeenCalled()
  })

  it('should validate input for server actions', async () => {
    const schema = z.object({ name: z.string() })
    const protectedAction = protectServerAction(mockAction, { schemaValidation: schema })

    const result = await protectedAction({ name: 123 })

    expect(result).toEqual({
      error: 'Validation failed',
      status: 400,
      details: expect.any(Object),
    })
  })
})
