import { type NextRequest, NextResponse } from 'next/server'
import type { z } from 'zod'
import type { CsrfConfig, SecureUser } from '../types'
import { readSecureCookie } from './cookies'
import { validateCsrfToken } from './csrf'
import { validateServerInput } from './validation'

export interface ProtectOptions {
  /** Require authentication */
  requireAuth?: boolean
  /** Required user roles */
  roles?: string[]
  /** Required permissions */
  permissions?: string[]
  /** CSRF protection configuration */
  csrf?: boolean | Partial<CsrfConfig>
  /** Rate limiting configuration */
  rateLimit?: {
    /** Maximum requests per window */
    max: number
    /** Time window in seconds */
    windowSeconds: number
    /** Custom key generator */
    keyGenerator?: (req: NextRequest) => string
  }
  /** Input validation schema */
  schemaValidation?: z.ZodSchema
  /** Custom authorization function */
  customAuth?: (user: SecureUser | null, req: NextRequest) => boolean | Promise<boolean>
}

interface ProtectedContext {
  user: SecureUser | null
  validatedInput?: unknown
}

type ProtectedHandler<T = unknown> = (
  req: NextRequest,
  context: ProtectedContext,
  params?: T,
) => Promise<NextResponse> | NextResponse

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, max: number, windowSeconds: number): boolean {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const entry = rateLimitStore.get(key)

  // Clean up expired entries on-demand
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
  }

  const currentEntry = rateLimitStore.get(key)

  if (!currentEntry) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (currentEntry.count >= max) {
    return false
  }

  currentEntry.count++
  return true
}

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Periodic cleanup (only when needed)
let lastCleanup = 0
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupExpiredEntries()
    lastCleanup = now
  }
}

export function protect<T = unknown>(handler: ProtectedHandler<T>, options: ProtectOptions = {}) {
  return async (req: NextRequest, params?: T): Promise<NextResponse> => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        maybeCleanup() // Clean up expired entries periodically

        const { max, windowSeconds, keyGenerator } = options.rateLimit
        const key = keyGenerator
          ? keyGenerator(req)
          : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'

        if (!checkRateLimit(key, max, windowSeconds)) {
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        }
      }

      // CSRF protection
      if (options.csrf) {
        const csrfConfig = typeof options.csrf === 'boolean' ? {} : options.csrf
        const isValidCsrf = await validateCsrfToken(req, csrfConfig)

        if (!isValidCsrf) {
          return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 })
        }
      }

      // Authentication check
      let user: SecureUser | null = null
      if (options.requireAuth || options.roles || options.permissions || options.customAuth) {
        user = await readSecureCookie<SecureUser>('session')

        if (options.requireAuth && !user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }
      }

      // Role-based authorization
      if (options.roles && options.roles.length > 0) {
        if (!user || !user.roles) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const hasRequiredRole = options.roles.some((role) => user.roles?.includes(role))
        if (!hasRequiredRole) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
      }

      // Permission-based authorization
      if (options.permissions && options.permissions.length > 0) {
        if (!user || !user.permissions) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const hasRequiredPermission = options.permissions.some((permission) =>
          user.permissions?.includes(permission),
        )
        if (!hasRequiredPermission) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
      }

      // Custom authorization
      if (options.customAuth) {
        const isAuthorized = await options.customAuth(user, req)
        if (!isAuthorized) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      // Input validation
      let validatedInput: unknown
      if (options.schemaValidation) {
        let input: unknown

        if (req.method === 'GET') {
          // Parse query parameters
          const url = new URL(req.url)
          input = Object.fromEntries(url.searchParams.entries())
        } else {
          // Parse request body
          try {
            const contentType = req.headers.get('content-type') || ''
            if (contentType.includes('application/json')) {
              input = await req.json()
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
              const formData = await req.formData()
              input = Object.fromEntries(formData.entries())
            } else {
              input = await req.text()
            }
          } catch (error) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
          }
        }

        const validation = validateServerInput(options.schemaValidation, input)
        if (!validation.isValid) {
          return NextResponse.json(
            { error: 'Validation failed', details: validation.errors },
            { status: 400 },
          )
        }
        validatedInput = validation.data
      }

      // Call the protected handler
      const context: ProtectedContext = {
        user,
        validatedInput,
      }

      return await handler(req, context, params)
    } catch (error) {
      console.error('[Blackshield] Protection middleware error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Server Action protection wrapper
export function protectServerAction<T extends unknown[], R>(
  action: (...args: T) => Promise<R>,
  options: Omit<ProtectOptions, 'rateLimit'> = {},
) {
  return async (...args: T): Promise<R | { error: string; status: number }> => {
    try {
      // Authentication check
      let user: SecureUser | null = null
      if (options.requireAuth || options.roles || options.permissions || options.customAuth) {
        user = await readSecureCookie<SecureUser>('session')

        if (options.requireAuth && !user) {
          return { error: 'Authentication required', status: 401 }
        }
      }

      // Role-based authorization
      if (options.roles && options.roles.length > 0) {
        if (!user || !user.roles) {
          return { error: 'Insufficient permissions', status: 403 }
        }

        const hasRequiredRole = options.roles.some((role) => user.roles?.includes(role))
        if (!hasRequiredRole) {
          return { error: 'Insufficient permissions', status: 403 }
        }
      }

      // Permission-based authorization
      if (options.permissions && options.permissions.length > 0) {
        if (!user || !user.permissions) {
          return { error: 'Insufficient permissions', status: 403 }
        }

        const hasRequiredPermission = options.permissions.some((permission) =>
          user.permissions?.includes(permission),
        )
        if (!hasRequiredPermission) {
          return { error: 'Insufficient permissions', status: 403 }
        }
      }

      // Custom authorization (create mock request for server actions)
      if (options.customAuth) {
        const mockReq = {} as NextRequest
        const isAuthorized = await options.customAuth(user, mockReq)
        if (!isAuthorized) {
          return { error: 'Access denied', status: 403 }
        }
      }

      // Input validation for first argument if schema provided
      if (options.schemaValidation && args.length > 0) {
        const validation = validateServerInput(options.schemaValidation, args[0])
        if (!validation.isValid) {
          return {
            error: 'Validation failed',
            status: 400,
            details: validation.errors,
            // biome-ignore lint/suspicious/noExplicitAny: Complex return type requires any for compatibility
          } as any
        }
        // Replace first argument with validated data
        args[0] = validation.data as T[0]
      }

      return await action(...args)
    } catch (error) {
      console.error('[Blackshield] Server action protection error:', error)
      return { error: 'Internal server error', status: 500 }
    }
  }
}
