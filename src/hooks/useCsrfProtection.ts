import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CsrfConfig } from '../types'

interface CsrfProtectionOptions extends Partial<CsrfConfig> {
  /** Enable automatic token injection */
  autoInject?: boolean
  /** Only inject for requests with credentials */
  credentialsOnly?: boolean
}

interface CsrfProtectionResult {
  /** Current CSRF token */
  token: string | null
  /** Whether token is loading */
  isLoading: boolean
  /** Get fresh token */
  refreshToken: () => Promise<void>
  /** Get token for manual use */
  getCsrfToken: () => string | null
  /** Enhanced fetch with CSRF protection */
  protectedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const DEFAULT_CONFIG: Required<CsrfProtectionOptions> = {
  tokenHeader: 'x-csrf-token',
  tokenCookie: 'csrf-token',
  tokenExpiry: 3600,
  autoInject: true,
  credentialsOnly: true,
}

/**
 * Hook for client-side CSRF protection
 */
export function useCsrfProtection(options: CsrfProtectionOptions = {}): CsrfProtectionResult {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...options }), [options])
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get token from cookie
  const getTokenFromCookie = useCallback((): string | null => {
    if (typeof document === 'undefined') return null

    const cookies = document.cookie.split(';')
    const csrfCookie = cookies.find((cookie) => cookie.trim().startsWith(`${config.tokenCookie}=`))

    if (csrfCookie) {
      return csrfCookie.split('=')[1]?.trim() || null
    }

    return null
  }, [config.tokenCookie])

  // Fetch fresh token from server
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        return data.token || null
      }
    } catch (error) {
      console.warn('[Blackshield] Failed to fetch CSRF token:', error)
    }

    return null
  }, [])

  // Refresh token
  const refreshToken = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    // Try cookie first
    let newToken = getTokenFromCookie()

    // If no cookie token, fetch from server
    if (!newToken) {
      newToken = await fetchToken()
    }

    setToken(newToken)
    setIsLoading(false)
  }, [getTokenFromCookie, fetchToken])

  // Get current token
  const getCsrfToken = useCallback((): string | null => {
    return token || getTokenFromCookie()
  }, [token, getTokenFromCookie])

  // Enhanced fetch with CSRF protection
  const protectedFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const currentToken = getCsrfToken()

      // Check if we should inject CSRF token
      const shouldInject =
        config.autoInject &&
        (!config.credentialsOnly ||
          init.credentials === 'include' ||
          init.credentials === 'same-origin')

      // Only inject for non-safe methods
      const method = init.method?.toUpperCase() || 'GET'
      const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method)

      if (shouldInject && !isSafeMethod && currentToken) {
        const headers = new Headers(init.headers)
        headers.set(config.tokenHeader, currentToken)

        const updatedInit = {
          ...init,
          headers,
        }

        return fetch(input, updatedInit)
      }

      return fetch(input, init)
    },
    [config, getCsrfToken],
  )

  // Initialize token on mount
  useEffect(() => {
    refreshToken()
  }, [refreshToken])

  // Set up automatic token refresh
  useEffect(() => {
    if (!config.autoInject) return

    const interval = setInterval(
      () => {
        // Refresh token periodically (every 30 minutes)
        refreshToken()
      },
      30 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [config.autoInject, refreshToken])

  return {
    token,
    isLoading,
    refreshToken,
    getCsrfToken,
    protectedFetch,
  }
}

/**
 * Utility function to get CSRF token from cookie
 */
export function getCsrfToken(tokenCookie = 'csrf-token'): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find((cookie) => cookie.trim().startsWith(`${tokenCookie}=`))

  if (csrfCookie) {
    return csrfCookie.split('=')[1]?.trim() || null
  }

  return null
}
