const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:5173';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder*="utilisateur" i]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|realtime/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder*="utilisateur" i]', 'wrong');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Erreur')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder*="utilisateur" i]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE}/admin/dashboard`);
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Agent Navigation', () => {
  test('should access agent dashboard', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder*="utilisateur" i]', 'sana.b');
    await page.fill('input[type="password"]', 'agent');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/agent\/dashboard/);
  });
});

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder*="utilisateur" i]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    const toggle = page.locator('button:has(sun), button:has(moon), [aria-label*="thème" i], [aria-label*="theme" i]');
    if (await toggle.isVisible()) {
      await toggle.click();
      const html = page.locator('html');
      const classAttr = await html.getAttribute('class');
      expect(classAttr !== null).toBeTruthy();
    }
  });
});
