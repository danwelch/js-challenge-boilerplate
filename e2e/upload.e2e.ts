import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// Playwright runs from the project root; fixtures live alongside the e2e specs.
const fixtures = join(process.cwd(), 'e2e', 'fixtures');

test.describe('Policy CSV upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the empty state before any upload', async ({ page }) => {
    await expect(page.locator('.results-empty')).toBeVisible();
    await expect(page.getByText('No policy numbers yet')).toBeVisible();
    // No table (real or placeholder) is rendered in the idle state.
    await expect(page.locator('app-policy-table')).toHaveCount(0);
  });

  test('shows a visible keyboard focus ring on the upload control (WCAG 2.4.7)', async ({
    page,
  }) => {
    // The file input is visually hidden, so focus lands on it but the *visible*
    // label must show the ring. :focus-visible only fires for keyboard, and the
    // outline transitions in — so drive it with a real Tab and let toHaveCSS
    // retry until the transition settles. This is real-browser-only behaviour,
    // hence e2e rather than a unit test.
    await page.keyboard.press('Tab');
    await expect(page.locator('#policy-file')).toBeFocused();
    // Ring mirrors the button's background; the key point is it's not transparent.
    await expect(page.locator('.upload__button')).not.toHaveCSS(
      'outline-color',
      'rgba(0, 0, 0, 0)',
    );
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

    // mod-11 checksum (US2): of the 10 sample numbers, only 457508000 and
    // 123456789 pass — the caption summary and per-row status reflect that.
    await expect(page.locator('caption')).toContainText('2 valid, 8 errors');
    const statuses = page.locator('td.policy-table__col-status');
    await expect(statuses.nth(0)).toContainText('Error'); // 457500000
    await expect(statuses.nth(3)).toContainText('Valid'); // 457508000
    await expect(statuses.nth(9)).toContainText('Valid'); // 123456789
  });

  test('locks the form inert while an upload is processing', async ({
    page,
  }) => {
    // The dev server runs in dev mode, where a ~1s demo delay keeps the
    // processing state on screen long enough to observe (0ms in production).
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'sample.csv'));

    // During the processing window the spinner shows and the whole upload
    // wrapper is `inert` — keyboard and assistive tech can't reopen the picker.
    await expect(page.getByText('Processing…')).toBeVisible();
    await expect(page.locator('.upload')).toHaveAttribute('inert', '');
    // The Results panel shows the loading skeleton (not the empty state) meanwhile.
    await expect(page.locator('.policy-table-skeleton__bar').first()).toBeVisible();

    // Once processing completes the form is interactive again (inert removed).
    await expect(page.locator('caption')).toContainText('(10)');
    await expect(page.locator('.upload')).not.toHaveAttribute('inert', '');
  });

  test('sorts and filters the loaded table', async ({ page }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'sample.csv'));
    await expect(page.locator('caption')).toContainText('(10)');

    // Sort by policy number ascending — the smallest number floats to the top.
    await page.getByRole('button', { name: /Policy number/ }).click();
    await expect(page.locator('.policy-table__number').first()).toHaveText(
      '123456789',
    );

    // Filter to valid only — 2 of the 10 sample numbers pass the checksum, while
    // the caption keeps the full totals.
    await page.locator('app-select-field select').first().selectOption('valid');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('caption')).toContainText('2 valid, 8 errors');
    await expect(page.locator('app-pagination .pagination__status')).toContainText(
      'Page 1 of 1',
    );
  });

  test('rejects a non-CSV file with an accessible error', async ({ page }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'not-a-policy.txt'));

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('not a CSV');
    // Empty-state overlay remains visible — no real policy table was loaded.
    await expect(page.locator('.results-empty')).toBeVisible();
  });

  test('rejects an empty CSV with the empty-content alert', async ({
    page,
  }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'sample-empty.csv'));

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('did not contain any policy numbers');
    await expect(page.locator('.results-empty')).toBeVisible();
  });

  test('rejects an oversize CSV with the size-limit alert', async ({
    page,
  }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'sample-too-large.csv'));

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('exceeds the 2 MB limit');
    await expect(page.locator('.results-empty')).toBeVisible();
  });

  test('reset round-trip: upload then reset shows dropzone and removes table', async ({
    page,
  }) => {
    await page
      .locator('#policy-file')
      .setInputFiles(join(fixtures, 'sample.csv'));

    await expect(page.locator('caption')).toHaveCount(1);

    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.locator('.upload__dropzone')).toBeVisible();
    await expect(page.locator('.results-empty')).toBeVisible();
  });

  test('drag-and-drop happy path loads the CSV', async ({ page }) => {
    const fileBytes = readFileSync(join(fixtures, 'sample.csv'));
    const base64 = fileBytes.toString('base64');

    // Inject the file into the page as a DataTransfer, then dispatch a drop event.
    await page.evaluate(async (b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const file = new File([bytes], 'sample.csv', { type: 'text/csv' });
      const dt = new DataTransfer();
      dt.items.add(file);

      const dropzone = document.querySelector('.upload__dropzone');
      dropzone?.dispatchEvent(
        new DragEvent('drop', { bubbles: true, dataTransfer: dt }),
      );
    }, base64);

    await expect(page.locator('tbody tr')).toHaveCount(10);
    await expect(page.locator('caption')).toContainText('(10)');
  });
});
