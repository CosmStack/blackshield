import { beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Next.js router and environment
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
})
