import { test, expect } from '@playwright/test';

test.describe('FileExplorer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();
  });

  test('clicking folder should navigate via cd command', async ({ page }) => {
    // Click on hyeonmin folder
    await page.getByRole('button', { name: 'hyeonmin' }).click();

    // Terminal should show cd command was executed
    await expect(page.getByText('$ cd hyeonmin')).toBeVisible();

    // Viewer should show contents of /home/hyeonmin
    await expect(page.getByRole('button', { name: 'projects' })).toBeVisible();
  });

  test('clicking file should open in vim', async ({ page }) => {
    // Navigate to hyeonmin first
    await page.getByRole('button', { name: 'hyeonmin' }).click();
    await expect(page.getByRole('button', { name: 'projects' })).toBeVisible();

    // Click on about.md button (not the terminal output)
    await page.getByRole('button', { name: 'md about.md' }).click();

    // Terminal title should show vim mode
    await expect(page.getByText('vim - about.md')).toBeVisible();

    // Viewer should show file content (rendered markdown)
    await expect(page.getByRole('heading', { name: 'Hyeonmin Lee' })).toBeVisible();
  });

  test('breadcrumb navigation should work', async ({ page }) => {
    // Navigate to hyeonmin/projects
    await page.getByRole('button', { name: 'hyeonmin' }).click();
    await page.getByRole('button', { name: 'projects' }).click();

    // Should be in /home/hyeonmin/projects (check terminal prompt)
    await expect(page.getByText('/home/hyeonmin/projects', { exact: true })).toBeVisible();

    // Click on hyeonmin in breadcrumb to go back
    // The breadcrumb is in the toolbar, not in the file grid
    await page.locator('[class*="bg-slate-900"]').getByRole('button', { name: 'hyeonmin' }).click();

    // Should be back in /home/hyeonmin
    await expect(page.getByText('/home/hyeonmin', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'projects' })).toBeVisible();
  });

  test('home button should navigate to ~', async ({ page }) => {
    // Navigate away first
    await page.getByRole('button', { name: 'hyeonmin' }).click();
    await expect(page.getByText('/home/hyeonmin', { exact: true })).toBeVisible();

    // Click Home button (the one with title="Home")
    await page.getByRole('button', { name: 'Home', exact: true }).click();

    // Should be back at home
    await expect(page.getByText('~', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'hyeonmin' })).toBeVisible();
  });
});

test.describe('Back/Forward Navigation', () => {
  test('back button should go to previous directory', async ({ page }) => {
    await page.goto('/');

    // Navigate: ~ -> hyeonmin -> projects
    await page.getByRole('button', { name: 'hyeonmin' }).click();
    await expect(page.getByRole('button', { name: 'projects' })).toBeVisible();

    await page.getByRole('button', { name: 'projects' }).click();
    await expect(page.getByText('/home/hyeonmin/projects', { exact: true })).toBeVisible();

    // Click back button (ChevronLeft button)
    await page.getByRole('button').first().click();

    // Should be back in /home/hyeonmin - verify by checking projects folder is visible again
    await expect(page.getByRole('button', { name: 'projects' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'md about.md' })).toBeVisible();
  });
});

test.describe('URL Navigation', () => {
  // These tests use full URLs because baseURL path handling in Playwright
  // doesn't work well with SPA path-based routing

  test('navigating to /about should open about.md in vim', async ({ page }) => {
    await page.goto('http://localhost:5173/portfolio/about');

    // Wait for terminal to be ready first
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();

    // Should show vim mode with about.md content (wait for deep link to execute)
    await expect(page.getByText('vim - about.md')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Hyeonmin Lee' })).toBeVisible();
  });

  test('navigating to /projects should show projects directory', async ({ page }) => {
    await page.goto('http://localhost:5173/portfolio/projects');

    // Wait for terminal to be ready first
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();

    // Should show project files - check for portfolio.md button (wait for deep link to execute)
    await expect(page.getByRole('button', { name: /portfolio/ })).toBeVisible({ timeout: 10000 });
  });

  test('navigating to /projects/portfolio should show project in vim', async ({ page }) => {
    await page.goto('http://localhost:5173/portfolio/projects/portfolio');

    // Wait for terminal to be ready first
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();

    // Should show vim mode with project content (wait for deep link to execute)
    await expect(page.getByText('vim - portfolio.md')).toBeVisible({ timeout: 10000 });
  });
});
