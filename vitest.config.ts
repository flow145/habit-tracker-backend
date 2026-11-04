import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    pool: 'threads',
    maxWorkers: 1,
  },
  plugins: [],
})
