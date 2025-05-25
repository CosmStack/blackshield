'use client'

// Example using @cosmstack/blackshield - in real usage, import from the package
// For development, we use relative imports to the source
import { SafeHTML, SecureProvider, useGuardedRoute, useSecureUser } from '../src'

// 1. Wrap your app with SecureProvider
function App() {
  return (
    <SecureProvider
      config={{
        dev: true,
        envValidation: {
          allowedPublicVars: ['NEXT_PUBLIC_APP_URL'],
        },
      }}
    >
      <Dashboard />
    </SecureProvider>
  )
}

// 2. Use secure user management
function Dashboard() {
  const { user, isAuthenticated, login, logout } = useSecureUser()

  const handleLogin = async () => {
    await login({
      id: '123',
      email: 'user@example.com',
      roles: ['admin'],
      permissions: ['read', 'write'],
    })
  }

  if (!isAuthenticated) {
    return (
      <div>
        <button type="button" onClick={handleLogin}>
          Login
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button type="button" onClick={logout}>
        Logout
      </button>
      <ProtectedContent />
    </div>
  )
}

// 3. Use route guards
function ProtectedContent() {
  const { isAuthorized, isLoading } = useGuardedRoute({
    requiredRoles: ['admin'],
    redirectTo: '/unauthorized',
  })

  if (isLoading) return <div>Loading...</div>
  if (!isAuthorized) return null

  return (
    <div>
      <h2>Admin Content</h2>
      <SafeHTMLExample />
    </div>
  )
}

// 4. Use safe HTML rendering
function SafeHTMLExample() {
  const userContent = '<script>alert("xss")</script><p>Safe content</p>'

  return (
    <div>
      <h3>User Content:</h3>
      <SafeHTML html={userContent} />
    </div>
  )
}

export default App
