import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:5173';
const outputDirectory = 'docs/screenshots';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  for (const [tab, filename] of [
    ['SIMULATOR', 'simulator.png'],
    ['COMPARE', 'compare.png'],
    ['STRESS LAB', 'stress-lab.png'],
  ]) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    if (tab === 'STRESS LAB') {
      await page.getByRole('button', { name: 'Add shock' }).click();
      await page.getByRole('button', { name: 'Run sweep' }).click();
      await page.getByText('Progress: complete').waitFor({ timeout: 30_000 });
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outputDirectory}/${filename}`, fullPage: true, animations: 'disabled' });
  }
} finally {
  await browser.close();
}
