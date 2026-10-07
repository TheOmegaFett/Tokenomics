import { test, expect } from '@playwright/test';

test('Tokenomics Lab loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByText('TOKENOMICS LAB')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SIMULATOR' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
});

test('playback controls advance, pause, step, reset, and complete', async ({ page }) => {
  await page.goto('/');
  const progress = page.getByRole('status', { name: 'Simulation progress' });
  await page.getByTitle('Reset', { exact: true }).click();
  await expect(progress).toHaveText('Cycle 0 of 365');
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(progress).toHaveText('Cycle 1 of 365');

  await page.getByRole('slider', { name: /Simulation speed/ }).fill('1');
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(progress).toHaveText('Cycle 2 of 365', { timeout: 3000 });
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.waitForTimeout(1200);
  await expect(progress).toHaveText('Cycle 2 of 365');

  await page.getByRole('slider', { name: /Simulation speed/ }).fill('60');
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(progress).toHaveText('Cycle 365 of 365', { timeout: 15_000 });
  await page.getByTitle('Reset', { exact: true }).click();
  await expect(progress).toHaveText('Cycle 0 of 365');
  await page.getByRole('button', { name: 'Complete' }).click();
  await expect(progress).toHaveText('Cycle 365 of 365');
});
