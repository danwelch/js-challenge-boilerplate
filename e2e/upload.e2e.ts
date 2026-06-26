import { test, expect } from '@playwright/test';
import { join } from 'node:path';

// Playwright runs from the project root; fixtures live alongside the e2e specs.
const fixtures = join(process.cwd(), 'e2e', 'fixtures');

test.describe('Policy CSV upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the empty state before any upload', async ({ page }) => {
    await expect(page.getByText('No policy numbers loaded yet')).toBeVisible();
    await expect(page.locator('app-policy-table')).toHaveCount(0);
  });

  test('loads all policy numbers from a valid CSV', async ({ page }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'sample.csv'));

    // The provided sample.csv contains 10 policy numbers.
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await expect(page.locator('caption')).toContainText('(10)');

    const numbers = page.locator('.policy-table__number');
    await expect(numbers.first()).toHaveText('457500000');
    await expect(numbers.last()).toHaveText('123456789');
  });

  test('rejects a non-CSV file with an accessible error', async ({ page }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'not-a-policy.txt'));

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('not a CSV');
    await expect(page.locator('app-policy-table')).toHaveCount(0);
  });
});
