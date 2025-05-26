#!/bin/bash

echo "🔍 Testing Blackshield build and functionality..."

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Run type checking
echo "📝 Running TypeScript type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type checking failed"
  exit 1
fi

# Run linting
echo "🔍 Running linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test -- --run
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# Check if CLI is executable
echo "🔧 Testing CLI..."
if [ -f "dist/cli/index.js" ]; then
  node dist/cli/index.js --version
  if [ $? -eq 0 ]; then
    echo "✅ CLI is working"
  else
    echo "❌ CLI failed to run"
    exit 1
  fi
else
  echo "❌ CLI binary not found"
  exit 1
fi

echo "✅ All tests passed! Blackshield is ready." 