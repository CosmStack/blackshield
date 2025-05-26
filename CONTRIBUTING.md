# Contributing to Blackshield

Thank you for your interest in contributing to @cosmstack/blackshield! This guide will help you get started.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cosmstack/blackshield.git
   cd blackshield
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development checks:**
   ```bash
   npm run typecheck  # TypeScript type checking
   npm run check      # Biome linting and formatting
   npm run build      # Build the library
   npm test          # Run tests
   ```

## Project Structure

```
src/
├── core/           # Security engine and context
├── hooks/          # React hooks
├── server/         # Server-side utilities
├── rules/          # ESLint rules
├── config/         # Default configurations
└── types/          # TypeScript definitions

examples/           # Usage examples
.github/workflows/  # CI/CD workflows
```

## Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and test:**
   ```bash
   npm run check      # Lint and format
   npm run build      # Build
   npm test          # Test
   ```

3. **Commit using conventional commits:**
   ```bash
   git commit -m "feat: add new security feature"
   git commit -m "fix: resolve XSS vulnerability"
   git commit -m "docs: update README"
   ```

4. **Push and create a PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## Release Process

### Automatic Releases (Recommended)

Releases are automatically created when commits are pushed to `main`:

- `feat:` commits → minor version bump
- `fix:` commits → patch version bump
- `feat!:` or `BREAKING CHANGE:` → major version bump

### Manual Releases

For manual releases, use the release script:

```bash
npm run release
```

This will:
1. Run all quality checks
2. Prompt for version bump type
3. Update version and build
4. Provide instructions for publishing

### Publishing to npm

After a release is created on GitHub, the publish workflow automatically:
1. Builds the package
2. Runs quality checks
3. Publishes to npm with public access

## Quality Standards

All contributions must pass:

- ✅ TypeScript type checking
- ✅ Biome linting and formatting
- ✅ Unit tests
- ✅ Build process
- ✅ Security review

## Security Focus

When contributing, always consider:

1. **Secure by default** - Safe patterns, no insecure fallbacks
2. **Transparency** - All security measures should be visible
3. **Developer experience** - Intuitive APIs and clear error messages
4. **Performance** - Minimal runtime overhead

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test in both development and production builds
- Verify examples work with the built package

## Documentation

- Update README for new features
- Add examples for new APIs
- Document breaking changes
- Update TypeScript definitions

## Getting Help

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues and PRs first

Thank you for contributing to making React/Next.js applications more secure! 🛡️ 