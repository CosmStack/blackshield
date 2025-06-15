# Setting up Blackshield Biome Plugin

## Current Status

🚧 **Biome Plugin Status**: Currently in development

Biome 2.0 introduced experimental GritQL-based plugins, but the TypeScript plugin API is still in development. We provide both current GritQL rules and future-ready plugin structure.

## Installation

```bash
npm install @cosmstack/blackshield @biomejs/biome
```

## Current Implementation (GritQL Rules)

### 1. Copy GritQL Files

Copy the GritQL rule files to your project:

```bash
# Create gritql directory
mkdir -p .gritql/blackshield

# Copy rule files from node_modules
cp node_modules/@cosmstack/blackshield/dist/biome/rules/gritql/* .gritql/blackshield/
```

### 2. Configure Biome

Update your `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "security": {
        "noDangerouslySetInnerHtml": "off"
      }
    }
  },
  "gritql": {
    "patterns": [
      ".gritql/blackshield/no-public-sensitive-env.gql",
      ".gritql/blackshield/no-unsafe-html.gql"
    ]
  }
}
```

## Future Implementation (Plugin API)

When Biome's plugin API becomes stable, you'll be able to use:

```json
{
  "plugins": ["@cosmstack/blackshield/biome-plugin"],
  "linter": {
    "rules": {
      "blackshield/no-public-sensitive-env": "error",
      "blackshield/no-unsafe-html": "error"
    }
  }
}
```

## Available Rules

### `no-public-sensitive-env`

Prevents exposure of sensitive environment variables through `NEXT_PUBLIC_*` prefixes.

**Examples:**

```javascript
// ❌ Error: Potentially sensitive
process.env.NEXT_PUBLIC_API_SECRET

// ✅ OK: Server-side only
process.env.API_SECRET
```

### `no-unsafe-html`

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

## Running Biome

```bash
# Check with current GritQL rules
npx biome check

# Apply fixes
npx biome check --apply

# Format code
npx biome format --write
```

## Migration from ESLint

If you're migrating from ESLint, you can use our conversion utility:

```typescript
import { convertEslintToBiomeOptions } from '@cosmstack/blackshield/biome-plugin'

const eslintConfig = require('./.eslintrc.json')
const biomeOptions = convertEslintToBiomeOptions(eslintConfig)
```

## Roadmap

- ✅ GritQL rule implementations (current)
- 🚧 TypeScript plugin API support (in development)
- 📋 Auto-fix capabilities
- 📋 Configuration migration tools
- 📋 IDE integration enhancements 