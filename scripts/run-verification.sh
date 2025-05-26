#!/bin/bash

echo "🛡️  Blackshield Implementation Verification"
echo "==========================================="

# Make verification script executable
chmod +x scripts/verify-implementation.ts

# Run the verification
npx tsx scripts/verify-implementation.ts

echo ""
echo "🔧 Running build test..."
npm run test:build 