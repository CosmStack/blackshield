import { defineConfig } from 'tsup'

export default defineConfig([
  // Main package
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', 'next', 'zod'],
    treeshake: true,
  },
  // Server utilities
  {
    entry: ['src/server/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist/server',
    external: ['react', 'next', 'zod', 'jose'],
    treeshake: true,
  },
  // ESLint rules
  {
    entry: ['src/rules/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist/rules',
    external: ['@typescript-eslint/utils'],
    treeshake: true,
  },
]) 