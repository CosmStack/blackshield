# @cosmstack/blackshield

A developer-first security toolkit for React/Next.js applications. Prevent common security vulnerabilities with minimal setup and intuitive APIs.

## Features

- 🛡️ **Environment Variable Protection** - Prevent accidental exposure of sensitive data
- 🔒 **XSS Protection** - Automatic HTML sanitization and safe rendering
- 🚪 **Route Guards** - Declarative authentication and authorization
- 🔐 **Secure Cookies** - Signed and encrypted cookie utilities
- 📊 **Static Analysis** - ESLint rules to catch security issues at build time
- 🎯 **TypeScript First** - Full type safety and excellent DX

## Quick Start

```bash
npm install @cosmstack/blackshield zod
```

### 1. Wrap your app

```tsx
import { SecureProvider } from '@cosmstack/blackshield'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SecureProvider>
          {children}
        </SecureProvider>
      </body>
    </html>
  )
}
```

### 2. Use secure authentication

```tsx
import { useSecureUser, useGuardedRoute } from '@cosmstack/blackshield'

function Dashboard() {
  const { user, login, logout } = useSecureUser()
  
  useGuardedRoute({
    requiredRoles: ['admin'],
    redirectTo: '/login'
  })

  return <div>Welcome {user?.email}</div>
}
```

### 3. Render HTML safely

```tsx
import { SafeHTML } from '@cosmstack/blackshield'

function UserContent({ html }) {
  return <SafeHTML html={html} />
}
```

### 4. Validate server input

```tsx
import { validateServerInput } from '@cosmstack/blackshield/server'
import { z } from 'zod'

export async function createPost(formData: FormData) {
  const validation = validateServerInput(
    z.object({
      title: z.string().min(1),
      content: z.string().max(1000),
    }),
    Object.fromEntries(formData)
  )

  if (!validation.isValid) {
    return { errors: validation.errors }
  }

  // Safe to use validation.data
}
```

## Configuration

Create `.blackshieldrc.json`:

```json
{
  "envValidation": {
    "allowedPublicVars": ["NEXT_PUBLIC_APP_URL"]
  },
  "xssProtection": {
    "autoSanitize": true
  }
}
```

## ESLint Integration

Add blackshield security rules to your ESLint configuration:

```json
{
  "extends": ["next/core-web-vitals"],
  "plugins": ["@cosmstack/blackshield/eslint-plugin"],
  "rules": {
    "@cosmstack/blackshield/no-unsafe-env": [
      "error",
      {
        "allowedVars": ["NEXT_PUBLIC_APP_URL"]
      }
    ],
    "@cosmstack/blackshield/no-unsafe-html": "error"
  }
}
```

## API Reference

### Hooks

- `useSecureUser()` - Secure user state management
- `useGuardedRoute(config)` - Route-level authorization
- `useBlackshield()` - Access to security context

### Components

- `<SecureProvider>` - Security context provider
- `<SafeHTML>` - XSS-safe HTML rendering

### Server Utilities

- `validateServerInput(schema, input)` - Zod-based validation
- `createSignedCookie(name, value, options)` - Secure cookie creation
- `readSecureCookie(name)` - Secure cookie reading

### Security Functions

- `sanitizeHTML(html, options)` - HTML sanitization
- `validateEnvironmentVariables(config)` - Env var validation

## License

MIT 