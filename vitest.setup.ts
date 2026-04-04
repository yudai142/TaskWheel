import '@testing-library/jest-dom'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Mock react-calendar CSS
vi.mock('react-calendar/dist/Calendar.css', () => ({}))
