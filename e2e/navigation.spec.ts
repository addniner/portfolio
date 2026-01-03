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
    // Click on hyeonmin folder in file grid (not sidebar)
    await getFileGridButton(page, 'hyeonmin').click();

    // Terminal should show cd command was executed
    await expect(page.getByText('$ cd hyeonmin')).toBeVisible();

    // Viewer should show contents of /home/hyeonmin
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
  });

  test('clicking file should open in vim', async ({ page }) => {
    // Navigate to hyeonmin first
    await getFileGridButton(page, 'hyeonmin').click();
    await expect(getFileGridButton(page, 'projects')).toBeVisible();

    // Click on about.md button (not the terminal output)
    await page.getByRole('button', { name: 'md about.md' }).click();

    // Terminal title should show vim mode
    await expect(page.getByText('vim - about.md')).toBeVisible();

    // Viewer should show file content (rendered markdown)
    await expect(page.getByRole('heading', { name: 'Hyeonmin Lee' })).toBeVisible();
  });

  test('breadcrumb navigation should work', async ({ page }) => {
    // Navigate to hyeonmin/projects
    await getFileGridButton(page, 'hyeonmin').click();
    await getFileGridButton(page, 'projects').click();

    // Should be in /home/hyeonmin/projects (check terminal prompt)
    await expect(page.getByText('/home/hyeonmin/projects', { exact: true })).toBeVisible();

    // Click on hyeonmin in breadcrumb to go back
    // Breadcrumb buttons are small (text-xs) and not in the file grid
    await page.locator('button.text-xs, button:has(.text-xs)').filter({ hasText: 'hyeonmin' }).click();

    // Should be back in /home/hyeonmin - verify by checking projects folder is visible
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
    await expect(page.getByRole('button', { name: 'md about.md' })).toBeVisible();
  });

  test('home button should navigate to ~', async ({ page }) => {
    // Navigate away first using sidebar
    await page.locator('button').filter({ hasText: /^hyeonmin$/ }).first().click();
    await expect(page.getByText('/home/hyeonmin', { exact: true })).toBeVisible();

    // Click Home button in sidebar (the first one)
    await page.locator('button').filter({ hasText: /^Home$/ }).first().click();

    // Should be back at home - check for hyeonmin folder in file grid
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
    // Check terminal shows ~ in prompt (use first() since ~ appears multiple times)
    await expect(page.getByText('~').first()).toBeVisible();
  });
});

test.describe('Back/Forward Navigation', () => {
  test('back button should go to previous directory', async ({ page }) => {
    await page.goto('/');

    // Navigate: ~ -> hyeonmin -> projects
    await getFileGridButton(page, 'hyeonmin').click();
    await expect(getFileGridButton(page, 'projects')).toBeVisible();

    await getFileGridButton(page, 'projects').click();
    await expect(page.getByText('/home/hyeonmin/projects', { exact: true })).toBeVisible();

    // Click back button (first button with aria-label for back navigation)
    await page.getByRole('button', { name: 'Go back to parent directory' }).click();

    // Should be back in /home/hyeonmin - verify by checking projects folder is visible again
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
