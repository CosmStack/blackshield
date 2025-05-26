# Blackshield Examples

This directory contains example usage of the `@cosmstack/blackshield` library.

## Examples

### `basic-usage.tsx`
Demonstrates the main React hooks and components:
- `SecureProvider` - Security context provider
- `useSecureUser` - Secure user state management
- `useGuardedRoute` - Route-level authorization
- `SafeHTML` - XSS-safe HTML rendering

### `server-actions.ts`
Shows server-side utilities for Next.js App Router:
- `validateServerInput` - Zod-based input validation
- `createSignedCookie` - Secure cookie creation
- `readSecureCookie` - Secure cookie reading

### `eslint-config-example.json`
Example ESLint configuration using blackshield security rules.

### `eslint-setup.md`
Complete guide for setting up the blackshield ESLint plugin.

## Import Patterns

### For Development (Current Examples)
The examples use relative imports to the source code for development:
```tsx
import { SecureProvider, useSecureUser } from '../src'
import { validateServerInput } from '../src/server'
```

### For Production Usage
When using the published package, import from the package name:
```tsx
import { SecureProvider, useSecureUser } from '@cosmstack/blackshield'
import { validateServerInput } from '@cosmstack/blackshield/server'
```

### For ESLint Rules
```json
{
  "plugins": ["@cosmstack/blackshield/eslint-plugin"]
}
```

## Notes

- The React examples require a Next.js environment to run
- Server utilities require Next.js App Router (13+)
- ESLint rules work in any JavaScript/TypeScript project
- Examples use relative imports for development; production usage imports from package name 