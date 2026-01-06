import { test, expect } from '@playwright/test';

// Helper to get file grid buttons (not sidebar buttons)
// File grid buttons have the 'group' class, sidebar buttons don't
const getFileGridButton = (page: ReturnType<typeof test.use>, name: string) =>
  page.locator('button.group').filter({ hasText: name });

test.describe('FileExplorer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();
  });

  test('clicking folder should navigate via cd command', async ({ page }) => {
    // Click on projects folder in file grid (not sidebar)
    await getFileGridButton(page, 'projects').click();

    // Terminal should show cd command was executed
    await expect(page.getByText('$ cd projects')).toBeVisible();

    // Viewer should show contents of ~/projects
    await expect(page.getByRole('button', { name: 'md portfolio.md' })).toBeVisible();
  });

  test('clicking file should open in vim', async ({ page }) => {
    // Click on about.md button (it's in home directory)
    await page.getByRole('button', { name: 'md about.md' }).click();

    // Terminal title should show vim mode
    await expect(page.getByText('vim - about.md')).toBeVisible();

    // Viewer should show file content (rendered markdown)
    await expect(page.getByRole('heading', { name: 'Hyeonmin Lee' })).toBeVisible();
  });

  test('breadcrumb navigation should work', async ({ page }) => {
    // Navigate to ~/projects
    await getFileGridButton(page, 'projects').click();

    // Should be in ~/projects (check terminal prompt)
    await expect(page.getByText('~/projects', { exact: true })).toBeVisible();

    // Click on guest in breadcrumb to go back to home
    await page.locator('button.text-xs, button:has(.text-xs)').filter({ hasText: 'guest' }).click();

    // Should be back in ~ - verify by checking projects folder is visible
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
    await expect(page.getByRole('button', { name: 'md about.md' })).toBeVisible();
  });

  test('back button from projects should navigate to home', async ({ page }) => {
    // Navigate to projects
    await getFileGridButton(page, 'projects').click();
    await expect(page.getByText('~/projects', { exact: true })).toBeVisible();

    // Click back button to go to home
    await page.getByRole('button', { name: 'Go back to parent directory' }).click();

    // Should be back at home - check for projects folder in file grid
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
    // Check terminal shows ~ in prompt
    await expect(page.getByText('~$').first()).toBeVisible();
  });
});

test.describe('Back/Forward Navigation', () => {
  test('back button should go to previous directory', async ({ page }) => {
    await page.goto('/');

    // Navigate: ~ -> projects
    await getFileGridButton(page, 'projects').click();
    await expect(page.getByText('~/projects', { exact: true })).toBeVisible();

    // Click back button
    await page.getByRole('button', { name: 'Go back to parent directory' }).click();

    // Should be back in ~ - verify by checking projects folder is visible again
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
    await expect(page.getByRole('button', { name: 'md about.md' })).toBeVisible();
  });
});

test.describe('URL Navigation', () => {
  // These tests use full URLs because baseURL path handling in Playwright
  // doesn't work well with SPA path-based routing

  test('navigating to /about should open about.md in vim', async ({ page }) => {
    await page.goto('http://localhost:5173/about');

    // Wait for terminal to be ready first
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();

    // Should show vim mode with about.md content (wait for deep link to execute)
    await expect(page.getByText('vim - about.md')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Hyeonmin Lee' })).toBeVisible();
  });

  test('navigating to /projects should show projects directory', async ({ page }) => {
    await page.goto('http://localhost:5173/projects');

    // Wait for terminal to be ready first
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();

    // Should show project files - check for portfolio.md button in file grid (wait for deep link to execute)
    await expect(getFileGridButton(page, 'portfolio.md')).toBeVisible({ timeout: 10000 });
  });

  test('navigating to /projects/portfolio should show project in vim', async ({ page }) => {
    await page.goto('http://localhost:5173/projects/portfolio');

    // Wait for terminal to be ready first
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();

    // Should show vim mode with project content (wait for deep link to execute)
    await expect(page.getByText('vim - portfolio.md')).toBeVisible({ timeout: 10000 });
  });
});
