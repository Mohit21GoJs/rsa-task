import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn().mockImplementation((url, options) => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'connect') {
          // Mock successful connection
          setTimeout(() => callback(), 10)
        } else if (event === 'notification') {
          // Mock notification received
          setTimeout(() => {
            callback({
              type: 'test',
              applicationId: 'test-id',
              company: 'Test Company',
              role: 'Test Role',
              message: 'Test message',
              timestamp: new Date().toISOString()
            })
          }, 100)
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true
    }
    return mockSocket
  })
}))

// Setup global fetch mock
global.fetch = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}) 