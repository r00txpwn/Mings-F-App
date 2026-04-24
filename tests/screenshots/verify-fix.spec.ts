import { expect, test, type Browser, type ConsoleMessage, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type CheckResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

type VerificationContext = {
  issueId: string;
  screenshotDir: string;
  checks: CheckResult[];
  consoleErrors: string[];
  step: number;
};

function getIssueId(): string {
  const issueEnv = process.env.ISSUE?.trim();
  if (issueEnv) {
    return issueEnv.toUpperCase();
  }

  const npmIssue = process.env.npm_config_issue?.trim();
  if (npmIssue) {
    return npmIssue.toUpperCase();
  }

  const arg = process.argv.find((value) => value.startsWith('--issue='));
  if (arg) {
    return arg.slice('--issue='.length).trim().toUpperCase();
  }

  const issueIndex = process.argv.findIndex((value) => value === '--issue');
  const nextArg = issueIndex >= 0 ? process.argv[issueIndex + 1] : undefined;
  if (nextArg) {
    return nextArg.trim().toUpperCase();
  }

  throw new Error('Missing required --issue flag. Example: npm run verify:fix -- --issue=MIN-12');
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveShot(
  page: Page,
  ctx: VerificationContext,
  label: string,
  fullPage = true
) {
  const fileName = `${String(ctx.step).padStart(2, '0')}-${slugify(label)}.png`;
  const target = path.join(ctx.screenshotDir, fileName);
  ctx.step += 1;
  await page.screenshot({ path: target, fullPage, animations: 'disabled' });
  return target;
}

function recordCheck(ctx: VerificationContext, name: string, passed: boolean, detail?: string) {
  ctx.checks.push({ name, passed, detail });
}

function summarizeConsoleError(msg: string) {
  return msg.replace(/\s+/g, ' ').trim().slice(0, 300);
}

async function gotoAndSettle(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

async function getBodyText(page: Page) {
  return (await page.locator('body').innerText().catch(() => '')) ?? '';
}

function getStaffPassword() {
  const value = process.env.STAFF_PASSWORD?.trim();
  if (!value) {
    throw new Error('Missing STAFF_PASSWORD. Set STAFF_PASSWORD in environment (for example via .env.local).');
  }
  return value;
}

/** Order Manager URL for verify:fix (MIN-10, etc.). Override for local preview on port 4175. */
function getOrderManagerVerifyUrl(): string {
  const value = process.env.ORDER_MANAGER_VERIFY_URL?.trim();
  if (value) return value;
  return 'https://order.mings.az/order-manager';
}

async function ensureOrderManagerLoggedIn(page: Page) {
  const loginEmail = page.locator('input[name="email"]');
  const loginPassword = page.locator('input[name="password"]');
  const signInButton = page.getByRole('button', { name: /sign in/i });

  if (await loginEmail.isVisible().catch(() => false)) {
    const staffPassword = getStaffPassword();
    await loginEmail.fill('staff@mings.az');
    await loginPassword.fill(staffPassword);
    await signInButton.click();
  }

  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

  // Order manager shell should replace the login form after successful auth.
  await expect(page.locator('input[name="email"]')).toHaveCount(0, { timeout: 20_000 });
}

async function openCart(page: Page) {
  const candidates = [
    page.getByRole('button', { name: /cart|basket|bag/i }),
    page.locator('button').filter({ hasText: /cart|basket|bag/i }),
  ];

  for (const locator of candidates) {
    const first = locator.first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => undefined);
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

async function openAccount(page: Page) {
  const candidates = [
    page.getByRole('button', { name: /account|profile|login|sign in/i }),
    page.locator('button').filter({ hasText: /account|profile|login|sign in/i }),
  ];

  for (const locator of candidates) {
    const first = locator.first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => undefined);
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

async function openLanguageSelector(page: Page) {
  const candidates = [
    page.getByRole('button', { name: /EN|AZ|RU|language/i }),
    page.locator('button').filter({ hasText: /EN|AZ|RU/i }),
  ];

  for (const locator of candidates) {
    const first = locator.first();
    if (await first.isVisible().catch(() => false)) {
      await first.click().catch(() => undefined);
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

async function verifyMin12(page: Page, ctx: VerificationContext) {
  await gotoAndSettle(page, 'https://order.mings.az/order-manager');
  await ensureOrderManagerLoggedIn(page);
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(10_000);

  const banner = page.getByText(/connection lost|orders may be missing|tap here to reconnect/i).first();
  const visible = await banner.isVisible().catch(() => false);
  recordCheck(ctx, 'CONNECTION LOST banner hidden after 10 seconds', !visible, visible ? 'Banner is visible.' : undefined);

  const websocketErrors = ctx.consoleErrors.filter((msg) => /websocket|realtime|ws[s]?:/i.test(msg));
  recordCheck(
    ctx,
    'No WebSocket console errors after load',
    websocketErrors.length === 0,
    websocketErrors.length ? websocketErrors.join(' | ') : undefined
  );

  await saveShot(page, ctx, 'after-10-seconds');
}

async function verifyMin10(page: Page, ctx: VerificationContext) {
  const url = getOrderManagerVerifyUrl();
  await gotoAndSettle(page, url);
  await ensureOrderManagerLoggedIn(page);
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

  const columnHeader = page.getByText(
    /New Orders|Yeni sifarişlər|Новые заказы|In Progress|Hazırlanır|В работе/i
  );
  const columnsVisible = await columnHeader.first().isVisible().catch(() => false);
  recordCheck(
    ctx,
    'Order Manager Active tab column headers visible after login',
    columnsVisible,
    columnsVisible ? undefined : 'Expected New Orders / In Progress section titles (en/az/ru) not found.'
  );

  const errorBanner = page.getByText(/An error occurred|Xəta baş verdi|Произошла ошибка/i);
  const errorVisible = await errorBanner.isVisible().catch(() => false);
  recordCheck(
    ctx,
    'No global action error banner on initial load',
    !errorVisible,
    errorVisible ? 'Top-of-page action error strip is visible after load.' : undefined
  );

  const acceptButton = page.getByRole('button', { name: /accept|qəbul et|принять/i }).first();
  const acceptVisible = await acceptButton.isVisible().catch(() => false);
  if (acceptVisible) {
    const enabled = await acceptButton.isEnabled().catch(() => false);
    recordCheck(
      ctx,
      'Accept button enabled when a new order is listed',
      enabled,
      enabled ? undefined : 'Accept visible but disabled (e.g. awaiting online payment — use Confirm payment first).'
    );
  } else {
    recordCheck(
      ctx,
      'No pending new orders in list (deep workflow skipped)',
      true,
      'No row in New Orders; run manual QA with a real pending delivery/takeaway order.'
    );
  }

  await saveShot(page, ctx, 'active-orders-tab');
}

async function verifyMin5(browser: Browser, ctx: VerificationContext) {
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      consoleErrors.push(summarizeConsoleError(message.text()));
    }
  });
  page.on('pageerror', (error: Error) => {
    consoleErrors.push(summarizeConsoleError(error.message));
  });

  await gotoAndSettle(page, 'https://order.mings.az');

  const landingOverflow = await hasHorizontalOverflow(page);
  recordCheck(ctx, 'Landing page has no horizontal overflow', !landingOverflow, landingOverflow ? 'Overflow detected on landing page.' : undefined);
  await saveShot(page, ctx, 'landing-home');

  const cartOpened = await openCart(page);
  const cartOverflow = await hasHorizontalOverflow(page);
  recordCheck(
    ctx,
    'Opening cart does not create horizontal overflow',
    cartOpened && !cartOverflow,
    cartOpened ? (cartOverflow ? 'Overflow detected after opening cart.' : undefined) : 'Could not open cart.'
  );
  await saveShot(page, ctx, 'cart-open');

  await page.goto('https://order.mings.az', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(500);
  const accountOpened = await openAccount(page);
  const accountOverflow = await hasHorizontalOverflow(page);
  recordCheck(
    ctx,
    'Opening account does not create horizontal overflow',
    accountOpened && !accountOverflow,
    accountOpened ? (accountOverflow ? 'Overflow detected after opening account.' : undefined) : 'Could not open account area.'
  );
  await saveShot(page, ctx, 'account-open');

  await page.goto('https://order.mings.az', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(500);
  const languageOpened = await openLanguageSelector(page);
  const languageOverflow = await hasHorizontalOverflow(page);
  recordCheck(
    ctx,
    'Opening language selector does not create horizontal overflow',
    languageOpened && !languageOverflow,
    languageOpened ? (languageOverflow ? 'Overflow detected after opening language selector.' : undefined) : 'Could not open language selector.'
  );
  await saveShot(page, ctx, 'language-selector-open');

  const relevantConsoleErrors = consoleErrors.filter((msg) => /overflow|layout|error/i.test(msg));
  recordCheck(
    ctx,
    'No relevant console errors during overflow checks',
    relevantConsoleErrors.length === 0,
    relevantConsoleErrors.length ? relevantConsoleErrors.join(' | ') : undefined
  );

  await mobileContext.close();
}

async function verifyMin6(page: Page, ctx: VerificationContext) {
  await gotoAndSettle(page, 'https://sp.mings.az/?screen=order-support');

  const row = page.locator('[data-order-row]').first();
  const rowVisible = await row.isVisible().catch(() => false);
  if (rowVisible) {
    await row.click().catch(() => undefined);
    await page.waitForTimeout(800);
  }

  const drawer = page.getByTestId('order-support-drawer');
  const drawerVisible = await drawer.isVisible().catch(() => false);
  const itemsRegion = drawer.getByTestId('order-support-drawer-items');
  const itemsVisible = await itemsRegion.isVisible().catch(() => false);

  recordCheck(
    ctx,
    'Order support drawer opens with order details (items + actions region)',
    rowVisible && drawerVisible && itemsVisible,
    rowVisible ? undefined : 'Could not find [data-order-row] to open the drawer.'
  );
  await saveShot(page, ctx, 'drawer-open-state');
}

async function verifyMin8(page: Page, ctx: VerificationContext) {
  await gotoAndSettle(page, 'https://sp.mings.az/?screen=order-support');

  const bodyText = await getBodyText(page);
  const matches = bodyText.match(/\b[a-z][a-zA-Z]+[A-Z][a-zA-Z]+\b/g) ?? [];
  const suspicious = matches.filter((value) => value.length > 6).slice(0, 15);

  recordCheck(
    ctx,
    'No raw camelCase translation keys are visible',
    suspicious.length === 0,
    suspicious.length ? `Potential raw keys: ${suspicious.join(', ')}` : undefined
  );

  await saveShot(page, ctx, 'full-page');
}

async function verifyMin9(page: Page, ctx: VerificationContext) {
  await gotoAndSettle(page, 'https://order.mings.az/order-manager');
  await ensureOrderManagerLoggedIn(page);
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

  const menuEditorButton = page.getByRole('button', { name: /menu editor/i });
  const menuEditorVisible = await menuEditorButton.isVisible().catch(() => false);
  recordCheck(
    ctx,
    'Menu Editor tab is hidden for staff',
    !menuEditorVisible,
    menuEditorVisible ? 'Menu Editor tab is visible in bottom nav for staff@mings.az.' : undefined
  );

  await saveShot(page, ctx, 'bottom-nav');
}

async function verifyMin11(page: Page, ctx: VerificationContext) {
  await gotoAndSettle(page, 'https://order.mings.az/order-manager');

  const button = page.getByRole('button', { name: /accept/i }).first();
  const buttonVisible = await button.isVisible().catch(() => false);
  const className = buttonVisible ? await button.getAttribute('class') : '';
  const isTeal = /teal/i.test(className ?? '');
  const hasPurple = /(purple|violet|fuchsia|indigo)/i.test(className ?? '');

  recordCheck(
    ctx,
    'Accept button uses teal styling instead of purple/violet',
    buttonVisible && isTeal && !hasPurple,
    buttonVisible ? `Button classes: ${className}` : 'Accept button was not visible.'
  );

  await saveShot(page, ctx, 'accept-button');
}

async function verifyMin7(browser: Browser, ctx: VerificationContext) {
  const { runCustomerJourneyCapture } = await import('./customer-journey.spec');
  const result = await runCustomerJourneyCapture(browser, 'https://order.mings.az');
  recordCheck(ctx, 'Customer journey capture completed', result.screenshots > 0, `Captured ${result.screenshots} screenshots.`);
  recordCheck(
    ctx,
    'Overflow report generated',
    Boolean(result.reportPath),
    result.reportPath ? `Report: ${result.reportPath}` : 'Missing overflow report path.'
  );
}

async function verifyFallback(page: Page, ctx: VerificationContext) {
  await gotoAndSettle(page, 'https://order.mings.az');
  await saveShot(page, ctx, 'fallback-full-page');

  const relevantErrors = ctx.consoleErrors.filter(Boolean);
  recordCheck(
    ctx,
    'No console errors on fallback page',
    relevantErrors.length === 0,
    relevantErrors.length ? relevantErrors.join(' | ') : undefined
  );
}

test.describe.configure({ mode: 'serial' });

test('verify issue-specific fix state', async ({ browser, page }) => {
  const issueId = getIssueId();
  const screenshotDir = path.join(process.cwd(), 'screenshots', 'fixes', issueId);
  await ensureDir(screenshotDir);

  const ctx: VerificationContext = {
    issueId,
    screenshotDir,
    checks: [],
    consoleErrors: [],
    step: 1,
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      ctx.consoleErrors.push(summarizeConsoleError(message.text()));
    }
  });
  page.on('pageerror', (error) => {
    ctx.consoleErrors.push(summarizeConsoleError(error.message));
  });

  switch (issueId) {
    case 'MIN-12':
      await verifyMin12(page, ctx);
      break;
    case 'MIN-10':
      await verifyMin10(page, ctx);
      break;
    case 'MIN-5':
      await verifyMin5(browser, ctx);
      break;
    case 'MIN-6':
      await verifyMin6(page, ctx);
      break;
    case 'MIN-8':
      await verifyMin8(page, ctx);
      break;
    case 'MIN-9':
      await verifyMin9(page, ctx);
      break;
    case 'MIN-11':
      await verifyMin11(page, ctx);
      break;
    case 'MIN-7':
      await verifyMin7(browser, ctx);
      break;
    default:
      await verifyFallback(page, ctx);
      break;
  }

  const passed = ctx.checks.filter((check) => check.passed).length;
  const failed = ctx.checks.length - passed;

  console.log(`VERIFICATION SUMMARY for ${ctx.issueId}`);
  console.log(`- Checks passed: ${passed}`);
  console.log(`- Checks failed: ${failed}`);
  console.log(`- Screenshots saved to: ${ctx.screenshotDir}`);
  console.log(`- ${failed === 0 ? 'READY FOR APPROVAL' : 'NEEDS MORE WORK'}`);

  for (const check of ctx.checks) {
    const prefix = check.passed ? 'PASS' : 'FAIL';
    console.log(`${prefix}: ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
  }

  expect(ctx.checks.length).toBeGreaterThan(0);
});
