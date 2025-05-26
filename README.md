# @cosmstack/blackshield

> A developer-first security toolkit for React/Next.js applications. Prevent common security vulnerabilities with minimal setup and intuitive APIs.

[![npm version](https://badge.fury.io/js/@cosmstack%2Fblackshield.svg)](https://badge.fury.io/js/@cosmstack%2Fblackshield)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🛡️ What is Blackshield?

Blackshield is a comprehensive security toolkit designed specifically for React and Next.js applications. It provides multiple layers of protection against common web vulnerabilities while maintaining excellent developer experience.

### Key Features

- **🔍 Environment Variable Protection** - Detect and prevent sensitive data exposure through `NEXT_PUBLIC_*` variables
- **🛡️ CSRF Protection** - Complete Cross-Site Request Forgery protection with automatic token management
- **🚫 XSS Protection** - Safe HTML rendering with automatic sanitization
- **🔐 Route Guards** - Declarative authentication and authorization for pages and components
- **⚡ Server Security** - Protect API routes and server actions with middleware
- **🔧 Static Analysis** - ESLint rules to catch security issues during development
- **📊 CLI Tools** - Command-line security analysis and project scanning
- **🏗️ Build Integration** - Next.js and Vite plugins for build-time security checks

## 🚀 Quick Start

### Installation

```bash
npm install @cosmstack/blackshield zod
```

### Initialize Configuration

```bash
npx @cosmstack/blackshield init
```

This creates `.blackshieldrc.json` and example ESLint configuration.

### Basic Setup

```tsx
// app/layout.tsx
import { SecureProvider } from '@cosmstack/blackshield'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SecureProvider config={{ dev: true }}>
          {children}
        </SecureProvider>
      </body>
    </html>
  )
}
```

### Run Security Analysis

```bash
npx @cosmstack/blackshield check
npx @cosmstack/blackshield scan-env
```

## 📚 Core Concepts

### Security Layers

Blackshield provides protection at multiple levels:

1. **Development Time** - ESLint rules catch issues as you code
2. **Build Time** - Plugins validate security during builds
3. **Runtime** - Components and hooks provide active protection

### Zero-Config Security

Most features work out of the box with sensible defaults, but everything is customizable for your specific needs.

## 🛡️ Security Checks Overview

Blackshield provides comprehensive protection against common web vulnerabilities through multiple detection and prevention mechanisms:

| Security Check | Type | When It Runs | What It Protects Against |
|---|---|---|---|
| **Environment Variable Leak Detection** | Static Analysis + CLI | Build/Dev/Manual | Sensitive data exposed via `NEXT_PUBLIC_*` variables |
| **CSRF Protection** | Runtime + Middleware | Request Time | Cross-site request forgery attacks |
| **XSS Protection** | Runtime + Static | Render Time + Dev | Malicious script injection via HTML content |
| **Route Guards** | Runtime | Navigation | Unauthorized access to protected pages |
| **Server Security** | Middleware | Request Time | Unprotected API routes and server actions |
| **Input Validation** | Runtime | Request Time | Invalid or malicious data processing |

### 🔍 Environment Variable Protection

**Protects Against:**
- API keys, secrets, and tokens exposed to client-side code
- Database URLs and credentials accessible in browser
- Private configuration leaked through `NEXT_PUBLIC_*` variables

**Detection Methods:**
- ✅ CLI command: `npx @cosmstack/blackshield scan-env`
- ✅ ESLint rule: `@cosmstack/blackshield/no-public-sensitive-env`
- ✅ Build-time validation via Next.js/Vite plugins
- ✅ Manual audit: `envAudit()` function

**When to Use:** Always run during development and CI/CD pipelines.

### 🛡️ CSRF Protection

**Protects Against:**
- Unauthorized actions performed on behalf of authenticated users
- State-changing operations without proper verification
- Cross-site request attacks targeting your API endpoints

**Implementation:**
- ✅ Client hook: `useCsrfProtection()` with automatic token injection
- ✅ Server middleware: `csrfMiddleware()` and `protect()` with `csrf: true`
- ✅ Manual token management: `generateCsrfToken()`, `validateCsrfToken()`

**When to Use:** For all state-changing operations (POST, PUT, DELETE) in authenticated applications.

### 🚫 XSS Protection

**Protects Against:**
- Cross-Site Scripting attacks through malicious HTML injection
- Execution of untrusted JavaScript code
- Data theft and session hijacking via script injection

**Implementation:**
- ✅ Safe component: `<SafeHTML>` for rendering user content
- ✅ Manual sanitization: `sanitizeHTML()` function
- ✅ React hook: `useSanitizedHTML()` for dynamic content
- ✅ ESLint rule: `@cosmstack/blackshield/no-unsafe-html` detects `dangerouslySetInnerHTML`

**When to Use:** Whenever rendering user-generated content, markdown, or HTML from external sources.

### 🔐 Server Security

**Protects Against:**
- Unprotected API routes accessible without authentication
- Missing authorization checks for sensitive operations
- Rate limiting bypass and DoS attacks
- Invalid input processing leading to security vulnerabilities

**Implementation:**
- ✅ Middleware: `protect()` for API routes with auth, roles, rate limiting
- ✅ Server actions: `protectServerAction()` for form submissions
- ✅ Input validation: Zod schema validation with `schemaValidation` option
- ✅ Rate limiting: Built-in rate limiting with configurable windows

**When to Use:** For all API endpoints and server actions that handle sensitive data or operations.

## 🔧 Features & Usage

### 🔍 Environment Variable Protection

Prevent accidental exposure of sensitive data through `NEXT_PUBLIC_*` variables.

#### What it protects against:
- API keys, secrets, and tokens exposed to client-side code
- Database URLs and credentials in browser
- Private configuration leaked through environment variables

#### Usage:

```bash
# Scan your project for sensitive variables
npx @cosmstack/blackshield scan-env
```

```typescript
// Manual validation
import { envAudit } from '@cosmstack/blackshield'

const result = await envAudit({
  allowedPublicVars: ['NEXT_PUBLIC_APP_URL']
})

if (!result.isValid) {
  console.error('Sensitive variables found:', result.sensitiveVars)
}
```

#### Configuration:

```json
// .blackshieldrc.json
{
  "envValidation": {
    "allowedPublicVars": [
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    ]
  }
}
```

### 🛡️ CSRF Protection

Complete Cross-Site Request Forgery protection with JWT-based tokens.

#### What it protects against:
- Unauthorized actions performed on behalf of authenticated users
- State-changing operations without proper verification
- Cross-site request attacks

#### Client-side Usage:

```tsx
import { useCsrfProtection } from '@cosmstack/blackshield'

function MyComponent() {
  const { protectedFetch, token, isLoading } = useCsrfProtection()

  const handleSubmit = async (data) => {
    // CSRF token automatically injected
    const response = await protectedFetch('/api/sensitive-action', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(data)
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

#### Server-side Usage:

```typescript
import { protect } from '@cosmstack/blackshield/server'

// Protect API route with CSRF validation
export default protect(async (req, { user }) => {
  // Handler logic here
  return Response.json({ success: true })
}, {
  requireAuth: true,
  csrf: true
})
```

### 🚫 XSS Protection

Safe HTML rendering with automatic sanitization.

#### What it protects against:
- Cross-Site Scripting attacks through malicious HTML injection
- Execution of untrusted JavaScript code
- Data theft and session hijacking

#### Usage:

```tsx
import { SafeHTML, sanitizeHTML } from '@cosmstack/blackshield'

// Safe component rendering
function BlogPost({ content }) {
  return (
    <article>
      <SafeHTML 
        html={content} 
        allowedTags={['p', 'strong', 'em', 'ul', 'ol', 'li']}
      />
    </article>
  )
}

// Manual sanitization
const result = sanitizeHTML(userInput, {
  allowedTags: ['p', 'strong'],
  allowedAttributes: ['class']
})

console.log(result.sanitized) // Clean HTML
console.log(result.removedTags) // ['script', 'iframe']
```

### 🔐 Authentication & Route Guards

Declarative authentication and authorization for your application.

#### User Management:

```tsx
import { useSecureUser } from '@cosmstack/blackshield'

function Dashboard() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    hasRole, 
    hasPermission 
  } = useSecureUser()

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {hasRole('admin') && <AdminPanel />}
      {hasPermission('write') && <CreateButton />}
    </div>
  )
}
```

#### Route Protection:

```tsx
import { useGuardedRoute } from '@cosmstack/blackshield'

function AdminPage() {
  const { isAuthorized, isLoading } = useGuardedRoute({
    requiredRoles: ['admin'],
    redirectTo: '/unauthorized'
  })

  if (isLoading) return <Loading />
  if (!isAuthorized) return null // Automatic redirect

  return <AdminDashboard />
}
```

### ⚡ Server Security

Comprehensive protection for API routes and server actions.

#### API Route Protection:

```typescript
import { protect } from '@cosmstack/blackshield/server'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).max(5)
})

export const POST = protect(async (req, { user, validatedInput }) => {
  const post = await createPost({
    ...validatedInput,
    authorId: user.id
  })
  
  return Response.json({ post })
}, {
  requireAuth: true,
  roles: ['user'],
  csrf: true,
  rateLimit: {
    max: 10, // 10 requests per minute
    windowSeconds: 60
  },
  schemaValidation: createPostSchema
})
```

#### Server Action Protection:

```typescript
import { protectServerAction } from '@cosmstack/blackshield/server'

export const updateProfile = protectServerAction(async (data) => {
  return await updateUserProfile(data)
}, {
  requireAuth: true,
  schemaValidation: profileSchema
})
```

### 🔧 Static Analysis

ESLint rules to catch security issues during development.

#### Setup:

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "plugins": ["@cosmstack/blackshield/eslint-plugin"],
  "rules": {
    "@cosmstack/blackshield/no-public-sensitive-env": "error",
    "@cosmstack/blackshield/no-unsafe-html": "error"
  }
}
```

#### What it catches:

```javascript
// ❌ Will trigger error
const apiKey = process.env.NEXT_PUBLIC_API_SECRET
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Safe alternatives
const apiKey = process.env.API_SECRET // Server-side only
<SafeHTML html={userContent} />
```

### 🏗️ Build Integration

Catch security issues during your build process.

#### Next.js Plugin:

```javascript
// next.config.js
import { withBlackshield } from '@cosmstack/blackshield/build/next'

const nextConfig = {
  // Your Next.js config
}

export default withBlackshield(nextConfig, {
  failOnEnvErrors: true,
  config: {
    envValidation: {
      allowedPublicVars: ['NEXT_PUBLIC_APP_URL']
    }
  }
})
```

#### Vite Plugin:

```javascript
// vite.config.js
import { blackshieldVite } from '@cosmstack/blackshield/build/vite'

export default defineConfig({
  plugins: [
    blackshieldVite({
      failOnEnvErrors: process.env.NODE_ENV === 'production'
    })
  ]
})
```

## 📊 CLI Commands

### Project Analysis

```bash
# Comprehensive security analysis
npx @cosmstack/blackshield check

# Analyze specific directory
npx @cosmstack/blackshield check --path ./src

# Output as JSON
npx @cosmstack/blackshield check --format json

# Use custom config
npx @cosmstack/blackshield check --config ./custom-config.json
```

### Environment Scanning

```bash
# Scan for sensitive environment variables
npx @cosmstack/blackshield scan-env

# Scan specific directory
npx @cosmstack/blackshield scan-env --path ./
```

### Configuration

```bash
# Initialize configuration files
npx @cosmstack/blackshield init

# Force overwrite existing config
npx @cosmstack/blackshield init --force
```

## ⚙️ Configuration

### Main Configuration File

```json
// .blackshieldrc.json
{
  "envValidation": {
    "allowedPublicVars": [
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    ]
  },
  "xssProtection": {
    "autoSanitize": true,
    "allowedTags": ["p", "strong", "em", "ul", "ol", "li"],
    "allowedAttributes": ["class", "id"]
  },
  "csrfProtection": {
    "enabled": true,
    "tokenHeader": "x-csrf-token",
    "tokenCookie": "csrf-token",
    "tokenExpiry": 3600
  },
  "boundaryProtection": {
    "validateServerProps": true
  }
}
```

### Environment Setup

```bash
# Required for CSRF protection
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Optional: Alternative secret for NextAuth.js compatibility
NEXTAUTH_SECRET=your-nextauth-secret
```

⚠️ **Security Warnings:**

- **JWT_SECRET**: Must be at least 32 characters long and cryptographically secure
- **Never commit secrets**: Add `.env*` to your `.gitignore` file
- **Rotate secrets regularly**: Change JWT secrets periodically in production
- **Use different secrets**: Never reuse the same secret across environments

**Example .env.local template:**

```bash
# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NEXTAUTH_SECRET=your-nextauth-secret-for-compatibility

# Database (Server-side only - NO NEXT_PUBLIC_ prefix)
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379

# API Keys (Server-side only - NO NEXT_PUBLIC_ prefix)
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG...

# Safe Public Variables (Explicitly allowed)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-...
```

## 📦 Package Structure

### Client-side Imports

```typescript
import { 
  // Core providers and hooks
  SecureProvider,
  useBlackshield,
  useSecureUser,
  useGuardedRoute,
  
  // CSRF protection
  useCsrfProtection,
  getCsrfToken,
  
  // XSS protection
  SafeHTML,
  sanitizeHTML,
  useSanitizedHTML,
  
  // Environment validation
  validateEnvironmentVariables,
  envAudit,
  scanEnvFiles,
  
  // Configuration
  DEFAULT_CONFIG
} from '@cosmstack/blackshield'
```

### Server-side Imports

```typescript
import { 
  // Input validation
  validateServerInput,
  commonSchemas,
  
  // Secure cookies
  createSignedCookie,
  readSecureCookie,
  deleteSecureCookie,
  
  // CSRF protection
  generateCsrfToken,
  verifyCsrfToken,
  setCsrfTokenCookie,
  validateCsrfToken,
  csrfMiddleware,
  
  // Middleware protection
  protect,
  protectServerAction
} from '@cosmstack/blackshield/server'
```

### Build Plugins

```typescript
// Next.js
import { withBlackshield } from '@cosmstack/blackshield/build/next'

// Vite
import { blackshieldVite } from '@cosmstack/blackshield/build/vite'
```

### ESLint Plugin

```json
{
  "plugins": ["@cosmstack/blackshield/eslint-plugin"]
}
```

## 🔍 TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  // Core types
  BlackshieldConfig,
  SecureUser,
  AuthContext,
  
  // Route protection
  RouteGuardConfig,
  
  // Server types
  ServerInputValidation,
  ProtectOptions,
  
  // Environment types
  EnvValidationResult,
  EnvAuditResult,
  
  // CSRF types
  CsrfToken,
  CsrfConfig,
  
  // XSS types
  XSSProtectionResult,
  
  // Analysis types
  SecurityIssue,
  AnalysisResult
} from '@cosmstack/blackshield'
```

## 🛡️ Security Best Practices

### Environment Variables

```bash
# ❌ Dangerous - exposes secrets to client
NEXT_PUBLIC_API_SECRET=secret123
NEXT_PUBLIC_DATABASE_URL=postgres://...

# ✅ Safe - server-side only
API_SECRET=secret123
DATABASE_URL=postgres://...

# ✅ Safe - explicitly allowed public variables
NEXT_PUBLIC_APP_URL=https://myapp.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Content Rendering

```tsx
// ❌ Dangerous - can execute malicious scripts
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Safe - automatically sanitized
<SafeHTML html={userContent} />

// ✅ Safe - manual sanitization with control
const { sanitized } = sanitizeHTML(userContent, {
  allowedTags: ['p', 'strong', 'em']
})
```

### API Protection

```typescript
// ❌ Unprotected API route
export async function POST(req: Request) {
  const data = await req.json()
  return Response.json(await createPost(data))
}

// ✅ Protected with authentication, validation, and rate limiting
export const POST = protect(async (req, { user, validatedInput }) => {
  return Response.json(await createPost({
    ...validatedInput,
    authorId: user.id
  }))
}, {
  requireAuth: true,
  schemaValidation: postSchema,
  rateLimit: { max: 10, windowSeconds: 60 }
})
```

## 🗺️ Roadmap

### ✅ v0.1.0 - Current Release (MVP)

**Core Security Features:**
- ✅ Environment Variable Leak Detection with CLI scanning
- ✅ CSRF Protection with JWT-based tokens
- ✅ XSS Protection with safe HTML rendering
- ✅ Route Guards for authentication and authorization
- ✅ Server Security middleware for API routes and server actions
- ✅ Input Validation with Zod schema support
- ✅ Rate Limiting with configurable windows
- ✅ ESLint Rules for static analysis
- ✅ CLI Tools for project analysis
- ✅ Build Integration for Next.js and Vite

**Developer Experience:**
- ✅ Zero-config setup with sensible defaults
- ✅ Full TypeScript support
- ✅ Comprehensive documentation
- ✅ Test coverage for all core features

### 🚧 v0.2.0 - Planned Features

**Enhanced Security:**
- 🔄 Content Security Policy (CSP) management
- 🔄 SQL Injection detection for database queries
- 🔄 File upload security validation
- 🔄 Session management improvements

**Developer Tools:**
- 🔄 Security dashboard for issue visualization
- 🔄 VS Code extension for real-time security hints
- 🔄 GitHub Actions integration
- 🔄 Automated security reports

**Integrations:**
- 🔄 Auth.js/NextAuth.js connector
- 🔄 Clerk authentication integration
- 🔄 Firebase Auth support
- 🔄 Supabase Auth integration

### 🔮 Future Vision

- 🔮 AI-powered security analysis
- 🔮 Real-time threat detection
- 🔮 Security compliance reporting (SOC 2, GDPR)
- 🔮 Multi-framework support (Remix, SvelteKit)

## 🧪 Test Coverage

Blackshield maintains comprehensive test coverage for all security features:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:env-audit
npm run test:csrf
npm run test:xss
npm run test:middleware
```

**Current Coverage:**
- ✅ Environment audit and scanning
- ✅ CSRF token generation and validation
- ✅ XSS protection and sanitization
- ✅ Route guards and authentication
- ✅ Server middleware protection
- ✅ ESLint rules validation
- ✅ CLI commands functionality

All tests include both unit tests and integration scenarios to ensure reliability in production environments.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [CosmStack](https://github.com/cosmstack)

## 🔗 Links

- [GitHub Repository](https://github.com/cosmstack/blackshield)
- [npm Package](https://www.npmjs.com/package/@cosmstack/blackshield)
- [Documentation](https://github.com/cosmstack/blackshield#readme)
- [Issues](https://github.com/cosmstack/blackshield/issues)

---

**Built with ❤️ by the CosmStack team**
