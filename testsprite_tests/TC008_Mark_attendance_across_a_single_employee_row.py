import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:4175/spec-ops")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Navigate to the Staff screen by opening the URL /spec-ops?screen=staff (http://127.0.0.1:4175/spec-ops?screen=staff).
        await page.goto("http://127.0.0.1:4175/spec-ops?screen=staff")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Email Address' and 'Password' fields and click the 'Sign In' button to access the Staff screen.
        # user@example.com email field
        elem = page.get_by_placeholder('user@example.com', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@system.local")
        
        # -> Fill the 'Email Address' and 'Password' fields and click the 'Sign In' button to access the Staff screen.
        # •••••••• password field
        elem = page.get_by_placeholder('••••••••', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Fill the 'Email Address' and 'Password' fields and click the 'Sign In' button to access the Staff screen.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Test Employee Aug01 2026' row to expand it and reveal that employee's calendar/day cells.
        # Test Employee Aug01 2026 Unpaid QA Tester ·... button
        elem = page.locator('xpath=/html/body/div/div/div/main/div/div/div[3]/div[9]/div/div/button')
        await elem.click(timeout=10000)
        
        # -> Click the day button labeled '1' (aria-label '2026-08-01: Work') to change it from Work to Absent and wait for the aria-label to update.
        # 2026-08-01: Work button
        elem = page.get_by_role('button', name='2026-08-01: Work', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the calendar day button labeled '1' (currently showing 'Absent') to change it to 'Off' and wait for the aria-label to update to confirm the Absent→Off transition.
        # 1 Absent button
        elem = page.get_by_role('button', name='2026-08-01: Absent', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the day '1' button currently labeled 'Off' (aria-label '2026-08-01: Off') to change it to 'Work' and verify the aria-label updates and the button remains enabled.
        # 1 Off button
        elem = page.get_by_role('button', name='2026-08-01: Off', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the day mark cycles through work, absent, and off states
        # Assert: Day 1 shows the Work state (aria-label = '2026-08-01: Work').
        await expect(page.locator("xpath=/html/body/div/div/div/main/div/div/div[3]/div[9]/div[2]/div[1]/div[3]/button[1]").nth(0)).to_have_attribute("aria-label", "2026-08-01: Work", timeout=15000), "Day 1 shows the Work state (aria-label = '2026-08-01: Work')."
        # Assert: Day 1 shows the Absent state (aria-label = '2026-08-01: Absent').
        await expect(page.locator("xpath=/html/body/div/div/div/main/div/div/div[3]/div[9]/div[2]/div[1]/div[3]/button[1]").nth(0)).to_have_attribute("aria-label", "2026-08-01: Absent", timeout=15000), "Day 1 shows the Absent state (aria-label = '2026-08-01: Absent')."
        # Assert: Day 1 shows the Off state (aria-label = '2026-08-01: Off').
        await expect(page.locator("xpath=/html/body/div/div/div/main/div/div/div[3]/div[9]/div[2]/div[1]/div[3]/button[1]").nth(0)).to_have_attribute("aria-label", "2026-08-01: Off", timeout=15000), "Day 1 shows the Off state (aria-label = '2026-08-01: Off')."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    