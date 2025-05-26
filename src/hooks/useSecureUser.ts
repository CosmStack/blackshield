'use client'

import { useCallback } from 'react'
import { useBlackshield } from '../core/context'
import type { SecureUser } from '../types'

export function useSecureUser() {
  const { auth, updateUser, setLoading, setError } = useBlackshield()

  const login = useCallback(
    async (user: SecureUser) => {
      setLoading(true)
      setError(undefined)

      try {
        // Validate user object
        if (!user.id) {
          throw new Error('User ID is required')
        }

        updateUser(user)
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(false)
      }
    },
    [updateUser, setLoading, setError],
  )

  const logout = useCallback(async () => {
    setLoading(true)
    setError(undefined)

    try {
      updateUser(null)
    } catch (error) {
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }, [updateUser, setLoading, setError])

  const hasRole = useCallback(
    (role: string): boolean => {
      return auth.user?.roles?.includes(role) ?? false
    },
    [auth.user],
  )

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return auth.user?.permissions?.includes(permission) ?? false
    },
    [auth.user],
  )

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => hasRole(role))
    },
    [hasRole],
  )

  const hasAllRoles = useCallback(
    (roles: string[]): boolean => {
      return roles.every((role) => hasRole(role))
    },
    [hasRole],
  )

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    error: auth.error,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
  }
}
