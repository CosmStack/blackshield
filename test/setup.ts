import { beforeEach, vi } from 'vitest'

// Mock Next.js router and environment
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
})
