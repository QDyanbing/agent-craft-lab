import { defineConfig } from '@playwright/test';

const E2E_PORT = Number(process.env.E2E_PORT ?? 8001);
if (!Number.isInteger(E2E_PORT) || E2E_PORT < 1 || E2E_PORT > 65535) {
  throw new Error('E2E_PORT must be an integer between 1 and 65535.');
}

const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
const API_PORT = process.env.E2E_API_PORT ?? '3001';
const API_URL = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'zh-CN',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
    },
  },
  webServer: [
    {
      cwd: '../backend',
      command: 'npm run build && npm start',
      env: { HOST: '127.0.0.1', PORT: API_PORT, QUESTIONNAIRE_DB: ':memory:' },
      url: `${API_URL}/api/health`,
      reuseExistingServer: false,
    },
    {
      command: `ut run dev --host 127.0.0.1 --port ${E2E_PORT} --strictPort`,
      env: { QUESTIONNAIRE_API_TARGET: API_URL, VITE_API_BASE_URL: '' },
      url: BASE_URL,
      reuseExistingServer: false,
    },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
