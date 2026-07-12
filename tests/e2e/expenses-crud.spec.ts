import { expect, test } from '@playwright/test';

const SAVED_RE = /saved successfully|uğurla yadda saxlan|успешно сохранено/i;
const CREATE_RE = /^create$|^yarat$|^создать$/i;
const CATEGORIES_TAB_RE = /^categories$|^kateqoriyalar$|^категории$/i;
const ADD_CATEGORY_RE = /add category|kateqoriya əlavə|добавить категорию/i;
const NEW_EXPENSE_RE = /new expense|yeni xərc|новый расход/i;
const CREATE_EXPENSE_RE = /create expense|xərc yarat|создать расход/i;
const AMOUNT_POSITIVE_RE = /greater than zero|sıfırdan böyük|больше нуля/i;

async function openExpensesCategoriesTab(page: import('@playwright/test').Page) {
  await page.goto('/spec-ops?screen=expenses', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 15_000 });
  await page.getByRole('button', { name: CATEGORIES_TAB_RE }).click();
  await expect(page.getByRole('button', { name: ADD_CATEGORY_RE })).toBeVisible({ timeout: 15_000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Expenses CRUD feedback', () => {
  test('categories: rapid double create only adds one row and shows success', async ({ page }) => {
    test.setTimeout(90_000);
    const uniqueName = `e2e-cat-${Date.now()}`;

    await openExpensesCategoriesTab(page);
    await page.getByRole('button', { name: ADD_CATEGORY_RE }).click();

    const nameInput = page.getByPlaceholder(/category name|kateqoriya adı|название категории/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill(uniqueName);

    const createBtn = page.locator('.fixed.inset-0').getByRole('button', { name: CREATE_RE });
    await expect(createBtn).toBeEnabled();
    await Promise.all([createBtn.click(), createBtn.click()]);

    await expect(page.getByText(SAVED_RE)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(uniqueName, { exact: true })).toHaveCount(1, { timeout: 10_000 });

    // Cleanup: delete the test category
    const categoryRow = page.locator('.cockpit-panel-solid').filter({ hasText: uniqueName }).first();
    await categoryRow.getByRole('button', { name: /delete|sil|удалить/i }).click();
    await categoryRow.getByRole('button', { name: /^delete$|^sil$|^удалить$/i }).click();
    await expect(page.getByText(uniqueName)).toHaveCount(0, { timeout: 20_000 });
  });

  test('operational expense: zero amount shows validation error and keeps modal open', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/spec-ops?screen=expenses', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole('button', { name: NEW_EXPENSE_RE }).click();
    await expect(page.getByRole('heading', { name: NEW_EXPENSE_RE })).toBeVisible();

    await page.locator('.fixed.inset-0 form').evaluate((form: HTMLFormElement) => {
      form.noValidate = true;
      form.requestSubmit();
    });

    await expect(page.getByText(AMOUNT_POSITIVE_RE)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: NEW_EXPENSE_RE })).toBeVisible();
  });

  test('operational expense: missing required fields show validation', async ({ page }) => {
    test.setTimeout(60_000);
    const ITEM_REQUIRED_RE = /select an expense item|xərc maddəsi|статью расхода/i;

    await page.goto('/spec-ops?screen=expenses', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole('button', { name: NEW_EXPENSE_RE }).click();
    await page.locator('form').locator('input[type="number"]').first().fill('1.255');

    await page.locator('.fixed.inset-0 form').evaluate((form: HTMLFormElement) => {
      form.noValidate = true;
      form.requestSubmit();
    });

    await expect(page.getByText(ITEM_REQUIRED_RE)).toBeVisible({ timeout: 10_000 });
  });

  test('operational expense: valid submit shows success and closes modal', async ({ page }) => {
    test.setTimeout(90_000);
    const note = `e2e-opex-${Date.now()}`;

    await page.goto('/spec-ops?screen=expenses', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole('button', { name: NEW_EXPENSE_RE }).click();

    const itemDropdown = page.locator('.fixed.inset-0 form').getByPlaceholder(/search/i).first();
    await itemDropdown.click();
    const firstItem = page.locator('.fixed.inset-0 form button').filter({ hasText: /.+/ }).nth(1);
    const itemVisible = await firstItem.isVisible().catch(() => false);
    if (!itemVisible) {
      test.skip(true, 'No expense items configured');
    }
    await firstItem.click();

    await page.locator('form').locator('input[type="number"]').first().fill('12.500');
    await page.locator('form select').last().selectOption({ index: 1 });
    await page.locator('form textarea').fill(note);

    const submitBtn = page.getByRole('button', { name: CREATE_EXPENSE_RE });
    await submitBtn.click();

    await expect(page.getByText(SAVED_RE)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: NEW_EXPENSE_RE })).toHaveCount(0, { timeout: 10_000 });

    await expect(page.getByText(note)).toBeVisible({ timeout: 15_000 });

    const expenseRow = page.locator('tr').filter({ hasText: note }).first();
    await expenseRow.getByRole('button', { name: /delete|sil|удалить/i }).click();
    await expenseRow.getByRole('button', { name: /^delete$|^sil$|^удалить$/i }).click();
    await expect(page.getByText(note)).toHaveCount(0, { timeout: 20_000 });
  });
});
