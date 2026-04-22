import { test, expect, devices, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';

type OverflowIssue = {
  viewport: string;
  screen: string;
  width: number;
  innerWidth: number;
  offender: string;
};

type LoadFailure = {
  viewport: string;
  screen: string;
  reason: string;
};

type SideEffectPair = {
  before: string;
  after: string;
  combined: string;
};

const ROOT = process.cwd();
const SCREENSHOT_ROOT = path.join(ROOT, 'screenshots');
const OVERFLOW_REPORT = path.join(SCREENSHOT_ROOT, 'overflow-report.md');

const VIEWPORTS = [
  {
    id: 'mobile',
    label: 'iPhone 14 Pro',
    contextOptions: {
      ...devices['iPhone 14 Pro'],
      viewport: { width: 393, height: 852 },
    },
  },
  {
    id: 'tablet',
    label: 'iPad',
    contextOptions: {
      ...devices['iPad (gen 7)'],
      viewport: { width: 768, height: 1024 },
    },
  },
  {
    id: 'desktop',
    label: 'Desktop 1440',
    contextOptions: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1440, height: 900 },
    },
  },
] as const;

const summary = {
  screenshots: 0,
  overflowIssues: [] as OverflowIssue[],
  failures: [] as LoadFailure[],
};

function resetSummary() {
  summary.screenshots = 0;
  summary.overflowIssues = [];
  summary.failures = [];
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

async function resetOutputDirs() {
  await fs.rm(SCREENSHOT_ROOT, { recursive: true, force: true });
  await ensureDir(path.join(SCREENSHOT_ROOT, 'mobile'));
  await ensureDir(path.join(SCREENSHOT_ROOT, 'tablet'));
  await ensureDir(path.join(SCREENSHOT_ROOT, 'desktop'));
}

async function safeGoto(page: Page, url: string, viewport: string, screen: string) {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
    if (res && res.status() >= 400) {
      summary.failures.push({ viewport, screen, reason: `HTTP ${res.status()} at ${url}` });
    }
  } catch (error) {
    summary.failures.push({
      viewport,
      screen,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

async function setLanguage(page: Page, code: 'en' | 'az' | 'ru') {
  await page.getByRole('button', { name: code.toUpperCase() }).click({ timeout: 3000 }).catch(() => undefined);
  await page.waitForTimeout(350);
}

async function getOverflowInfo(page: Page): Promise<OverflowIssue | null> {
  const result = await page.evaluate(() => {
    const width = document.documentElement.scrollWidth;
    const innerWidth = window.innerWidth;
    if (width <= innerWidth) return null;

    const els = Array.from(document.querySelectorAll<HTMLElement>('body *'));
    let offender: HTMLElement | null = null;
    let offenderRight = innerWidth;

    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const right = rect.right;
      const computed = window.getComputedStyle(el);
      if (computed.position === 'fixed' && rect.width <= innerWidth) continue;
      if (right > offenderRight + 1 || el.scrollWidth > innerWidth + 1) {
        offender = el;
        offenderRight = Math.max(right, el.scrollWidth);
      }
    }

    const selectorOf = (el: Element | null): string => {
      if (!el) return 'unknown';
      const parts: string[] = [];
      let current: Element | null = el;
      while (current && parts.length < 6) {
        let part = current.tagName.toLowerCase();
        if ((current as HTMLElement).id) {
          part += `#${(current as HTMLElement).id}`;
          parts.unshift(part);
          break;
        }
        const cls = Array.from(current.classList).slice(0, 2).join('.');
        if (cls) part += `.${cls}`;
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(' > ');
    };

    return {
      width,
      innerWidth,
      offender: selectorOf(offender),
    };
  });

  return result;
}

async function applyOverflowOverlay(page: Page, offender: string) {
  await page.evaluate((targetSelector) => {
    document.querySelectorAll('[data-overflow-highlight]').forEach((el) => {
      el.removeAttribute('data-overflow-highlight');
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
      (el as HTMLElement).style.boxShadow = '';
    });

    document.documentElement.style.boxShadow = 'inset 0 0 0 4px rgba(239, 68, 68, 0.95)';
    const target = targetSelector && targetSelector !== 'unknown' ? document.querySelector(targetSelector) : null;
    if (target instanceof HTMLElement) {
      target.setAttribute('data-overflow-highlight', 'true');
      target.style.outline = '4px solid rgba(239, 68, 68, 0.95)';
      target.style.outlineOffset = '2px';
      target.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.25)';
    }
  }, offender);
}

async function clearOverflowOverlay(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.boxShadow = '';
    document.querySelectorAll<HTMLElement>('[data-overflow-highlight]').forEach((el) => {
      el.removeAttribute('data-overflow-highlight');
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.boxShadow = '';
    });
  });
}

async function capture(
  page: Page,
  viewportId: string,
  index: number,
  label: string,
  options: { fullPage?: boolean; overflowName?: string } = {}
) {
  const dir = path.join(SCREENSHOT_ROOT, viewportId);
  const base = `${String(index).padStart(2, '0')}-${slugify(label)}`;
  const screenshotPath = path.join(dir, `${base}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: options.fullPage ?? true, animations: 'disabled' });
  summary.screenshots += 1;

  const overflow = await getOverflowInfo(page);
  if (overflow) {
    summary.overflowIssues.push({
      viewport: viewportId,
      screen: label,
      width: overflow.width,
      innerWidth: overflow.innerWidth,
      offender: overflow.offender,
    });
    console.log(`HORIZONTAL OVERFLOW DETECTED on ${label} at ${viewportId}`);
    console.log(`  widest element: ${overflow.offender}`);
    await applyOverflowOverlay(page, overflow.offender);
    await page.screenshot({
      path: path.join(dir, `${base}-overflow.png`),
      fullPage: options.fullPage ?? true,
      animations: 'disabled',
    });
    summary.screenshots += 1;
    await clearOverflowOverlay(page);
  }

  return screenshotPath;
}

async function createSideBySideComposite(
  context: BrowserContext,
  before: string,
  after: string,
  output: string,
  title: string
) {
  const beforeBuf = await fs.readFile(before);
  const afterBuf = await fs.readFile(after);
  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.setContent(`
    <html>
      <body style="margin:0;background:#0f172a;color:#e2e8f0;font-family:Arial,sans-serif;">
        <div style="padding:20px">
          <h1 style="margin:0 0 16px;font-size:24px;">${title}</h1>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
            <figure style="margin:0">
              <figcaption style="margin:0 0 8px;font-weight:bold;">Before</figcaption>
              <img style="width:100%;border:1px solid #334155;border-radius:12px;" src="data:image/png;base64,${beforeBuf.toString('base64')}" />
            </figure>
            <figure style="margin:0">
              <figcaption style="margin:0 0 8px;font-weight:bold;">After</figcaption>
              <img style="width:100%;border:1px solid #334155;border-radius:12px;" src="data:image/png;base64,${afterBuf.toString('base64')}" />
            </figure>
          </div>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: output, fullPage: true });
  summary.screenshots += 1;
  await page.close();
}

async function sideEffectPair(
  page: Page,
  context: BrowserContext,
  viewportId: string,
  index: number,
  label: string,
  trigger: () => Promise<void>,
  reverse?: () => Promise<void>
): Promise<SideEffectPair> {
  const dir = path.join(SCREENSHOT_ROOT, viewportId);
  const base = `${String(index).padStart(2, '0')}-${slugify(label)}`;
  const before = path.join(dir, `${base}-before.png`);
  const after = path.join(dir, `${base}-after.png`);
  const combined = path.join(dir, `${base}.png`);
  await page.screenshot({ path: before, fullPage: true });
  summary.screenshots += 1;
  await trigger();
  await page.waitForTimeout(400);
  await page.screenshot({ path: after, fullPage: true });
  summary.screenshots += 1;
  await createSideBySideComposite(context, before, after, combined, label);
  if (reverse) {
    await reverse().catch(() => undefined);
    await page.waitForTimeout(250);
  }
  return { before, after, combined };
}

async function scrollToPercent(page: Page, percent: number) {
  await page.evaluate((p) => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: max * p, behavior: 'instant' as ScrollBehavior });
  }, percent);
  await page.waitForTimeout(300);
}

async function clickFirstCategory(page: Page) {
  const chips = page.locator('button.ming-chip');
  const count = await chips.count();
  if (count > 1) {
    await chips.nth(1).click();
    await page.waitForTimeout(400);
  }
}

async function openModifierModal(page: Page) {
  const withOptions = page.locator('text=+options').first();
  if (await withOptions.isVisible().catch(() => false)) {
    await withOptions.locator('xpath=ancestor::article[1]').click();
    await page.waitForTimeout(500);
    return true;
  }
  const productCard = page.locator('article.ming-product').first();
  if (await productCard.count()) {
    await productCard.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

async function modalAddToCart(page: Page, quantity: number) {
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  const plusButtons = dialog.locator('button').filter({ has: page.locator('svg.lucide-plus, svg') });
  const visibleButtons = await plusButtons.all();
  for (let i = 1; i < quantity; i += 1) {
    const plus = visibleButtons[visibleButtons.length - 1];
    await plus.click().catch(() => undefined);
    await page.waitForTimeout(150);
  }
  await dialog.getByRole('button', { name: /add to cart|səbətə əlavə et|в корзину/i }).click();
  await page.waitForTimeout(500);
}

async function openCart(page: Page) {
  const mobileCart = page.getByRole('button', { name: /cart/i });
  if (await mobileCart.isVisible().catch(() => false)) {
    await mobileCart.click();
    await page.waitForTimeout(350);
    return;
  }
  const cartButton = page.locator('button[aria-label]').filter({ has: page.locator('svg') }).nth(1);
  await cartButton.click().catch(() => undefined);
  await page.waitForTimeout(350);
}

async function openAccount(page: Page) {
  const mobileAccount = page.getByRole('button', { name: /account/i });
  if (await mobileAccount.isVisible().catch(() => false)) {
    await mobileAccount.click();
    await page.waitForTimeout(350);
    return;
  }
  const accountButton = page.locator('button[aria-label]').filter({ has: page.locator('svg') }).nth(0);
  await accountButton.click().catch(() => undefined);
  await page.waitForTimeout(350);
}

async function backToMenuIfNeeded(page: Page) {
  const menuBtn = page.getByRole('button', { name: /menu/i });
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click().catch(() => undefined);
    await page.waitForTimeout(300);
    return;
  }
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function proceedToCheckout(page: Page) {
  const checkoutButton = page.getByRole('button', { name: /checkout|place order|continue checkout|checkout ·/i }).last();
  await checkoutButton.click({ timeout: 5000 }).catch(() => undefined);
  await page.waitForTimeout(500);
}

async function selectFulfillment(page: Page, label: RegExp) {
  await page.getByRole('button', { name: label }).click({ timeout: 3000 }).catch(() => undefined);
  await page.waitForTimeout(300);
}

async function waitForManualResume(message: string) {
  console.log('');
  console.log('MANUAL STEP REQUIRED');
  console.log(message);
  if (!process.stdin.isTTY) {
    console.log('Non-interactive terminal detected, continuing without pause.');
    return;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => rl.question('Press Enter to continue...', () => resolve()));
  rl.close();
}

async function maybeCaptureOtpStep(page: Page, viewportId: string, index: number) {
  const phone = process.env.SCREENSHOT_PHONE_NUMBER?.trim();
  if (!phone) {
    console.log('OTP step skipped: set SCREENSHOT_PHONE_NUMBER to exercise SMS code flow manually.');
    return;
  }
  const phoneInput = page.locator('input[type="tel"], input').filter({ hasText: '' }).first();
  await phoneInput.fill(phone).catch(() => undefined);
  const sendCode = page.getByRole('button', { name: /send sms code|send code|sms/i }).first();
  if (await sendCode.isVisible().catch(() => false)) {
    await sendCode.click().catch(() => undefined);
    await page.waitForTimeout(800);
    await capture(page, viewportId, index, 'login-otp-step', { fullPage: true });
    await waitForManualResume(
      'Enter the OTP in the browser if available, or inspect the OTP screen, then continue the screenshot run.'
    );
  }
}

async function attemptAddressAutocomplete(page: Page) {
  const input = page.locator('input').filter({ has: page.locator('..') }).nth(2);
  const searchInput = page.locator('input[autocomplete="off"]').first();
  const target = (await searchInput.count()) ? searchInput : input;
  await target.click().catch(() => undefined);
  await target.fill('28 May').catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function attemptOutsideZone(page: Page) {
  const searchInput = page.locator('input[autocomplete="off"]').first();
  const candidates = ['Bilgah', 'Mardakan', 'Bina', 'Novkhani'];
  for (const candidate of candidates) {
    await searchInput.fill(candidate).catch(() => undefined);
    await page.waitForTimeout(1200);
    const option = page.locator('li[role="option"], [role="option"]').first();
    if (await option.isVisible().catch(() => false)) {
      await option.click().catch(() => undefined);
      await page.waitForTimeout(800);
      const text = (await page.locator('body').textContent()) ?? '';
      if (/outside|zone|kənar|вне/i.test(text)) {
        return true;
      }
    }
  }
  return false;
}

async function writeOverflowReport() {
  const grouped = new Map<string, OverflowIssue[]>();
  for (const issue of summary.overflowIssues) {
    const list = grouped.get(issue.viewport) ?? [];
    list.push(issue);
    grouped.set(issue.viewport, list);
  }

  const lines = [
    '# Overflow Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Total screenshots captured: ${summary.screenshots}`,
    '',
    '## Overflow Issues',
    '',
  ];

  if (summary.overflowIssues.length === 0) {
    lines.push('No horizontal overflow issues detected.');
  } else {
    for (const [viewport, issues] of grouped.entries()) {
      lines.push(`### ${viewport}`);
      lines.push('');
      for (const issue of issues) {
        lines.push(
          `- **${issue.screen}**: scrollWidth=${issue.width}, innerWidth=${issue.innerWidth}, offender=\`${issue.offender}\``
        );
      }
      lines.push('');
    }
  }

  lines.push('## Failed Loads', '');
  if (summary.failures.length === 0) {
    lines.push('No failed loads recorded.');
  } else {
    for (const failure of summary.failures) {
      lines.push(`- **${failure.viewport} / ${failure.screen}**: ${failure.reason}`);
    }
  }
  lines.push('');

  await fs.writeFile(OVERFLOW_REPORT, lines.join('\n'), 'utf8');
}

test.describe.configure({ mode: 'serial' });

export async function runCustomerJourneyCapture(browser: Browser, baseURL?: string | null) {
  await resetOutputDirs();
  resetSummary();

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext(viewport.contextOptions as never);
    const page = await context.newPage();
    const base = baseURL ?? 'https://order.mings.az';
    let step = 1;

    console.log(`\n=== ${viewport.label} (${viewport.id}) ===`);

    await safeGoto(page, base, viewport.id, 'landing-home');
    await capture(page, viewport.id, step++, 'landing-home');

    await scrollToPercent(page, 0.5);
    await capture(page, viewport.id, step++, 'menu-middle');

    await scrollToPercent(page, 1);
    await capture(page, viewport.id, step++, 'menu-bottom');

    await scrollToPercent(page, 0);
    await clickFirstCategory(page);
    await capture(page, viewport.id, step++, 'category-filter-selected');

    if (await openModifierModal(page)) {
      await capture(page, viewport.id, step++, 'modifier-modal-open');
      await capture(page, viewport.id, step++, 'modifier-modal-expanded');
      await modalAddToCart(page, 1);
    } else {
      summary.failures.push({ viewport: viewport.id, screen: 'modifier-modal-open', reason: 'Could not find clickable product card/modal.' });
    }

    await openCart(page);
    await capture(page, viewport.id, step++, 'cart-empty-state');
    await backToMenuIfNeeded(page);

    if (await openModifierModal(page)) {
      await modalAddToCart(page, 1);
      await openCart(page);
      await capture(page, viewport.id, step++, 'cart-with-1-item');
      await backToMenuIfNeeded(page);
    }

    if (await openModifierModal(page)) {
      await modalAddToCart(page, 3);
      await openCart(page);
      await capture(page, viewport.id, step++, 'cart-with-3-plus-items');
    }

    await sideEffectPair(
      page,
      context,
      viewport.id,
      step++,
      'cart-open-side-effect',
      async () => {
        await backToMenuIfNeeded(page);
        await openCart(page);
      },
      async () => {
        await backToMenuIfNeeded(page);
      }
    );

    await sideEffectPair(
      page,
      context,
      viewport.id,
      step++,
      'account-open-side-effect',
      async () => {
        await openAccount(page);
      },
      async () => {
        await backToMenuIfNeeded(page);
      }
    );

    await openAccount(page);
    await capture(page, viewport.id, step++, 'login-otp-screen');
    await maybeCaptureOtpStep(page, viewport.id, step);
    step += process.env.SCREENSHOT_PHONE_NUMBER ? 1 : 0;
    await backToMenuIfNeeded(page);

    await sideEffectPair(
      page,
      context,
      viewport.id,
      step++,
      'language-selector-side-effect',
      async () => {
        await setLanguage(page, 'az');
      },
      async () => {
        await setLanguage(page, 'en');
      }
    );

    await capture(page, viewport.id, step++, 'language-selector-all-3-languages');
    await setLanguage(page, 'ru');
    await page.waitForTimeout(250);
    await setLanguage(page, 'en');
    await page.waitForTimeout(250);

    await openCart(page);
    await proceedToCheckout(page);
    await capture(page, viewport.id, step++, 'checkout-takeaway-mode');

    await selectFulfillment(page, /delivery/i);
    await page.waitForTimeout(500);
    await capture(page, viewport.id, step++, 'checkout-delivery-mode-map-visible');

    const beforeAfter = await sideEffectPair(
      page,
      context,
      viewport.id,
      step++,
      'address-autocomplete-dropdown',
      async () => {
        await attemptAddressAutocomplete(page);
      }
    );
    void beforeAfter;

    const outsideZoneFound = await attemptOutsideZone(page);
    if (outsideZoneFound) {
      await capture(page, viewport.id, step++, 'zone-outside-error-state');
    } else {
      summary.failures.push({
        viewport: viewport.id,
        screen: 'zone-outside-error-state',
        reason: 'Could not reliably trigger outside-zone state with available suggestions.',
      });
    }

    await capture(page, viewport.id, step++, 'payment-method-selection');

    await context.close();
  }

  await writeOverflowReport();

  console.log('\n=== Screenshot Summary ===');
  console.log(`Total screenshots captured: ${summary.screenshots}`);
  if (summary.overflowIssues.length === 0) {
    console.log('Overflow issues: none detected');
  } else {
    const byViewport = new Map<string, string[]>();
    for (const issue of summary.overflowIssues) {
      byViewport.set(issue.viewport, [...(byViewport.get(issue.viewport) ?? []), issue.screen]);
    }
    for (const [viewport, screens] of byViewport.entries()) {
      console.log(`Overflow on ${viewport}: ${screens.join(', ')}`);
    }
  }
  if (summary.failures.length === 0) {
    console.log('Failed loads: none');
  } else {
    console.log('Failed loads / skipped states:');
    for (const failure of summary.failures) {
      console.log(`- ${failure.viewport} / ${failure.screen}: ${failure.reason}`);
    }
  }
  console.log(`Overflow report: ${OVERFLOW_REPORT}`);
  return {
    screenshots: summary.screenshots,
    overflowIssues: [...summary.overflowIssues],
    failures: [...summary.failures],
    reportPath: OVERFLOW_REPORT,
    screenshotsRoot: SCREENSHOT_ROOT,
  };
}

test('capture customer journey screenshots across mobile, tablet, and desktop', async ({ browser, baseURL }) => {
  await runCustomerJourneyCapture(browser, baseURL);
});
