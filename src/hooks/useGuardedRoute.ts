'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { RouteGuardConfig } from '../types'
import { useSecureUser } from './useSecureUser'

export function useGuardedRoute(config: RouteGuardConfig = {}) {
  const { user, isLoading, isAuthenticated } = useSecureUser()
  const router = useRouter()

  const { requiredRoles = [], requiredPermissions = [], redirectTo = '/login', customAuth } = config

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // Check if user is authenticated
    if (!isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Blackshield] Unauthenticated user accessing protected route')
      }
      router.push(redirectTo)
      return
    }

    // Check custom authorization
    if (customAuth && !customAuth(user)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Blackshield] Custom authorization failed')
      }
      router.push(redirectTo)
      return
    }

    // Check required roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => user?.roles?.includes(role))
      if (!hasRequiredRole) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Blackshield] User missing required roles:', requiredRoles)
        }
        router.push(redirectTo)
        return
      }
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some((permission) =>
        user?.permissions?.includes(permission),
      )
      if (!hasRequiredPermission) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Blackshield] User missing required permissions:', requiredPermissions)
        }
        router.push(redirectTo)
        return
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRoles,
    requiredPermissions,
    customAuth,
    redirectTo,
    router,
  ])

  return {
    isAuthorized:
      isAuthenticated &&
      (requiredRoles.length === 0 || requiredRoles.some((role) => user?.roles?.includes(role))) &&
      (requiredPermissions.length === 0 ||
        requiredPermissions.some((permission) => user?.permissions?.includes(permission))) &&
      (!customAuth || customAuth(user)),
    isLoading,
    user,
  }
}
