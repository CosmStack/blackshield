# Setting up Blackshield ESLint Plugin

## Installation

```bash
npm install @cosmstack/blackshield eslint @typescript-eslint/parser
```

## Configuration

Create or update your `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals"],
  "plugins": ["@cosmstack/blackshield/eslint-plugin"],
  "rules": {
    "@cosmstack/blackshield/no-unsafe-env": [
      "error",
      {
        "allowedVars": ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_API_URL"]
      }
    ],
    "@cosmstack/blackshield/no-unsafe-html": "error"
  }
}
```

## Available Rules

### `@cosmstack/blackshield/no-unsafe-env`

Prevents exposure of sensitive environment variables through `NEXT_PUBLIC_*` prefixes.

**Options:**
- `allowedVars`: Array of explicitly allowed public environment variables

**Examples:**

```javascript
// ❌ Error: Potentially sensitive
process.env.NEXT_PUBLIC_API_SECRET

// ✅ OK: Explicitly allowed
process.env.NEXT_PUBLIC_APP_URL

// ✅ OK: Server-side only
process.env.API_SECRET
```

### `@cosmstack/blackshield/no-unsafe-html`

Prevents unsafe HTML injection vulnerabilities.

**Examples:**

```jsx
// ❌ Error: Unsafe HTML injection
<div dangerouslySetInnerHTML={{__html: userContent}} />

// ❌ Error: Direct innerHTML assignment
element.innerHTML = userContent

// ✅ OK: Use SafeHTML component
<SafeHTML html={userContent} />
```

## Running ESLint

```bash
npx eslint . --ext .ts,.tsx,.js,.jsx
``` 