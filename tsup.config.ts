import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', 'next', 'zod', 'isomorphic-dompurify'],
  },
  // Server utilities
  {
    entry: ['src/server/index.ts'],
    outDir: 'dist/server',
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react', 'next', 'zod', 'jose'],
  },
  // ESLint plugin
  {
    entry: ['src/rules/index.ts'],
    outDir: 'dist/rules',
    format: ['cjs', 'esm'],
    dts: true,
    external: ['@typescript-eslint/utils'],
  },
  // CLI
  {
    entry: ['src/cli/index.ts'],
    outDir: 'dist/cli',
    format: ['esm'],
    dts: true,
    external: ['commander', 'glob'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Next.js plugin
  {
    entry: ['src/build/next-plugin.ts'],
    outDir: 'dist/build',
    format: ['cjs', 'esm'],
    dts: true,
    external: ['next'],
  },
  // Vite plugin
  {
    entry: ['src/build/vite-plugin.ts'],
    outDir: 'dist/build',
    format: ['cjs', 'esm'],
    dts: true,
    external: ['vite'],
  },
])
