const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:5173';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder*="utilisateur" i]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin\//);
  });

  test('should view admin dashboard', async ({ page }) => {
    await expect(page.locator('nav, [role="navigation"], aside')).toBeVisible();
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.click('a:has-text("Agents")');
    await expect(page).toHaveURL(/agents/);
  });

  test('should navigate to salaries page', async ({ page }) => {
    await page.click('a:has-text("Salaires"), button:has-text("Salaires")');
    await expect(page).toHaveURL(/salaires|salary/);
  });

  test('should navigate to alerts page', async ({ page }) => {
    await page.click('a:has-text("Alertes"), button:has-text("Alertes")');
    await expect(page).toHaveURL(/alertes|alerts/);
  });

  test('should display sidebar with navigation links', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [role="navigation"]');
    await expect(sidebar).toBeVisible();
    const links = await sidebar.locator('a, button').count();
    expect(links).toBeGreaterThan(5);
  });
});
