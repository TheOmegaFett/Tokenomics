import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /playwright-runtime\.spec\.js/,
  use: {
    baseURL: 'http://localhost:5173',
  },
});
