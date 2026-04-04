/// <reference types="@testing-library/jest-dom" />
/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-calendar CSS
vi.mock('react-calendar/dist/Calendar.css', () => ({}))
