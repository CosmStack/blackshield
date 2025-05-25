#!/bin/bash

# Manual release script for @cosmstack/blackshield
set -e

echo "🔍 Running pre-release checks..."

# Run all checks
npm run typecheck
npm run check
npm run build
npm test

echo "✅ All checks passed!"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Ask for version bump type
echo "🚀 What type of release?"
echo "1) patch (bug fixes)"
echo "2) minor (new features)"
echo "3) major (breaking changes)"
read -p "Enter choice (1-3): " choice

case $choice in
  1) BUMP_TYPE="patch" ;;
  2) BUMP_TYPE="minor" ;;
  3) BUMP_TYPE="major" ;;
  *) echo "❌ Invalid choice"; exit 1 ;;
esac

# Bump version
echo "📈 Bumping $BUMP_TYPE version..."
npm version $BUMP_TYPE

NEW_VERSION=$(node -p "require('./package.json').version")
echo "🎉 New version: $NEW_VERSION"

# Build again with new version
npm run build

echo "📤 Ready to publish!"
echo "Run 'npm publish --access public' to publish to npm"
echo "Run 'git push --follow-tags' to push to GitHub" 