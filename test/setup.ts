import React from 'react'
import { beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Make React globally available for JSX
global.React = React

// Mock Next.js router and environment
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
})
