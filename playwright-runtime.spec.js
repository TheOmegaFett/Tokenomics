import { test, expect } from '@playwright/test';

test('Tokenomics Lab loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await expect(page.getByText('TOKENOMICS LAB')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SIMULATOR' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
});
