'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_CONFIG } from '../config/defaults'
import type { AuthContext, BlackshieldConfig, SecureUser } from '../types'
import { validateEnvironmentVariables } from './env-validator'

interface BlackshieldContextValue {
  config: Required<BlackshieldConfig>
  auth: AuthContext
  updateUser: (user: SecureUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | undefined) => void
}

const BlackshieldContext = createContext<BlackshieldContextValue | null>(null)

interface SecureProviderProps {
  children: React.ReactNode
  config?: Partial<BlackshieldConfig>
  initialUser?: SecureUser | null
  onAuthChange?: (user: SecureUser | null) => void
}

export function SecureProvider({
  children,
  config = {},
  initialUser = null,
  onAuthChange,
}: SecureProviderProps) {
  const [user, setUser] = useState<SecureUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])

  // Validate environment variables on mount in development
  useEffect(() => {
    if (mergedConfig.dev) {
      const validation = validateEnvironmentVariables(mergedConfig.envValidation)
      if (!validation.isValid) {
        console.warn('[Blackshield] Environment validation issues:', validation.errors)
      }
      if (validation.warnings.length > 0) {
        console.warn('[Blackshield] Environment warnings:', validation.warnings)
      }
    }
  }, [mergedConfig])

  const updateUser = (newUser: SecureUser | null) => {
    setUser(newUser)
    onAuthChange?.(newUser)
  }

  const contextValue: BlackshieldContextValue = {
    config: mergedConfig,
    auth: {
      user,
      isLoading,
      isAuthenticated: user !== null,
      error,
    },
    updateUser,
    setLoading: setIsLoading,
    setError,
  }

  return <BlackshieldContext.Provider value={contextValue}>{children}</BlackshieldContext.Provider>
}

export function useBlackshield() {
  const context = useContext(BlackshieldContext)
  if (!context) {
    throw new Error('useBlackshield must be used within a SecureProvider')
  }
  return context
}
