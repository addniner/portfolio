import { test, expect } from '@playwright/test';

// Helper to get file grid buttons (not sidebar buttons)
// File grid buttons have the 'group' class, sidebar buttons don't
const getFileGridButton = (page: ReturnType<typeof test.use>, name: string) =>
  page.locator('button.group').filter({ hasText: name });

test.describe('Terminal Commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for terminal to be ready
    await expect(page.getByRole('textbox', { name: 'Terminal input' })).toBeVisible();
  });

  test('should show initial directory view', async ({ page }) => {
    // Should show FileExplorer with hyeonmin folder (symlink in /home/guest)
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('help command should output to terminal only', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('help');
    await terminal.press('Enter');

    // Should show help text in terminal output
    await expect(page.getByText('Available commands:')).toBeVisible();
    await expect(page.getByText('Use Tab for autocomplete')).toBeVisible();

    // Viewer should NOT change - still show FileExplorer
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('ls command should output to terminal only', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('ls');
    await terminal.press('Enter');

    // Should show directory listing in terminal (use first match since sidebar also shows 'hyeonmin')
    await expect(page.getByText('hyeonmin').first()).toBeVisible();

    // Viewer should NOT change
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('ls / should not change viewer', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('ls /');
    await terminal.press('Enter');

    // Should show root directory listing in terminal
    await expect(page.getByText(/home\//)).toBeVisible();

    // Viewer should still show /home/guest (not root)
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('whoami command should output to terminal only', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('whoami');
    await terminal.press('Enter');

    // Should show name in terminal output
    await expect(page.getByText('Hyeonmin Lee')).toBeVisible();

    // Viewer should NOT change
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('cd command should change directory and viewer', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('cd hyeonmin');
    await terminal.press('Enter');

    // Prompt should show new directory
    await expect(page.getByText('/home/hyeonmin', { exact: true })).toBeVisible();

    // Viewer should show contents of /home/hyeonmin
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
    await expect(page.getByRole('button', { name: 'md about.md' })).toBeVisible();
  });

  test('cd ~ should return to home directory', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });

    // First navigate away
    await terminal.fill('cd hyeonmin');
    await terminal.press('Enter');
    await expect(page.getByText('/home/hyeonmin', { exact: true })).toBeVisible();

    // Then go home
    await terminal.fill('cd ~');
    await terminal.press('Enter');

    // Prompt should show ~ (home) - use first match since ~ appears multiple times in terminal
    await expect(page.getByText('~').first()).toBeVisible();
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('clear command should clear terminal only', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });

    // Run some commands first
    await terminal.fill('help');
    await terminal.press('Enter');
    await expect(page.getByText('Available commands:')).toBeVisible();

    // Clear
    await terminal.fill('clear');
    await terminal.press('Enter');

    // Help text should be gone
    await expect(page.getByText('Available commands:')).not.toBeVisible();

    // Viewer should still be the same
    await expect(getFileGridButton(page, 'hyeonmin')).toBeVisible();
  });

  test('unknown command should show error', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('unknowncommand');
    await terminal.press('Enter');

    await expect(page.getByText(/command not found/i)).toBeVisible();
  });

  test('command chaining with && should work', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });
    await terminal.fill('cd hyeonmin && ls');
    await terminal.press('Enter');

    // Should show ls output
    await expect(page.getByText(/projects\//)).toBeVisible();

    // Viewer should show /home/hyeonmin
    await expect(getFileGridButton(page, 'projects')).toBeVisible();
  });

  test('command chaining with && should stop on error', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });

    // First cd to hyeonmin
    await terminal.fill('cd hyeonmin');
    await terminal.press('Enter');

    // Try to cd to nonexistent directory && ls
    await terminal.fill('cd nonexistent && ls');
    await terminal.press('Enter');

    // Should show error
    await expect(page.getByText(/No such file or directory/i)).toBeVisible();

    // ls should NOT have run (no additional output)
  });

  test('history command should show command history', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });

    // Run some commands
    await terminal.fill('help');
    await terminal.press('Enter');
    await terminal.fill('ls');
    await terminal.press('Enter');
    await terminal.fill('history');
    await terminal.press('Enter');

    // Should show previous commands in output
    await expect(page.getByText(/1\s+help/)).toBeVisible();
    await expect(page.getByText(/2\s+ls/)).toBeVisible();
  });

  test('vim command should open file in vim mode', async ({ page }) => {
    const terminal = page.getByRole('textbox', { name: 'Terminal input' });

    // Navigate to hyeonmin first
    await terminal.fill('cd hyeonmin');
    await terminal.press('Enter');

    // Open about.md in vim
    await terminal.fill('vim about.md');
    await terminal.press('Enter');

    // Terminal title should show vim
    await expect(page.getByText('vim - about.md')).toBeVisible();

    // Viewer should show VimViewer with file content (use heading role to be specific)
    await expect(page.getByRole('heading', { name: 'Hyeonmin Lee' })).toBeVisible();
  });
});
