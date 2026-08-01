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
        
        # -> Open the Staff screen by navigating to the URL /spec-ops?screen=staff so the page can be inspected (and sign in performed if required).
        await page.goto("http://localhost:4175/spec-ops?screen=staff")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Email Address' and 'Password' fields and click the 'Sign In' button to authenticate.
        # user@example.com email field
        elem = page.get_by_placeholder('user@example.com', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@system.local")
        
        # -> Fill the 'Email Address' and 'Password' fields and click the 'Sign In' button to authenticate.
        # •••••••• password field
        elem = page.get_by_placeholder('••••••••', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Fill the 'Email Address' and 'Password' fields and click the 'Sign In' button to authenticate.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Expand the 'Test Employee Aug01 2026' row so the attendance day cells and detailed controls become visible.
        # Test Employee Aug01 2026 Unpaid QA Tester ·... button
        elem = page.locator('xpath=/html/body/div/div/div/main/div/div/div[3]/div[9]/div/div/button')
        await elem.click(timeout=10000)
        
        # -> Record the current payable (₼1000.000) for 'Test Employee Aug01 2026', then click the day cell labeled '10' (currently 'Work') to cycle it to 'Absent' and verify the payable updates.
        # 2026-08-10: Work button
        elem = page.get_by_role('button', name='2026-08-10: Work', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the day button labeled '11' to cycle it from Work → Absent and observe the payable and attendance summary update.
        # 2026-08-11: Work button
        elem = page.get_by_role('button', name='2026-08-11: Work', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the day button labeled '12' (the '12' day cell currently showing Work) to cycle it to Absent and then verify the payable and absent count updates.
        # 2026-08-12: Work button
        elem = page.get_by_role('button', name='2026-08-12: Work', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '13' day button to cycle it from Work → Absent and verify the aria-label updates to indicate 'Absent'.
        # 2026-08-13: Work button
        elem = page.get_by_role('button', name='2026-08-13: Work', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '13' day cell to cycle it to Off and verify the aria-label updates to '2026-08-13: Off' and that weekly off days remain included (look for 'in salary').
        # 13 Absent button
        elem = page.get_by_role('button', name='2026-08-13: Absent', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '14' day button in the attendance grid to change it from Work → Absent and verify the aria-label updates to '2026-08-14: Absent' and the payable decreases to ₼870.968.
        # 2026-08-14: Work button
        elem = page.get_by_role('button', name='2026-08-14: Work', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '14' day button to cycle it from Absent → Off and verify the aria-label updates to '2026-08-14: Off', the payable updates (expected around ₼903.226), and that weekly off days remain included (look for 'in salary').
        # 14 Absent button
        elem = page.get_by_role('button', name='2026-08-14: Absent', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the payable amount decreases
        # Assert: Absence deduction line shows −₼96.774, confirming the payable decreased.
        await expect(page.locator("xpath=/html/body/div").nth(0)).to_contain_text("3 absent \u00d7 \u20bc32.258 = \u2212\u20bc96.774", timeout=15000), "Absence deduction line shows \u2212\u20bc96.774, confirming the payable decreased."
        
        # --> Verify weekly off days remain included in the payroll calculation
        # Assert: The page header states that weekly offs stay included in salary.
        await expect(page.locator("xpath=/html/body/div").nth(0)).to_contain_text("weekly offs stay in salary", timeout=15000), "The page header states that weekly offs stay included in salary."
        # Assert: The attendance legend indicates 'Off' days are included in salary.
        await expect(page.locator("xpath=/html/body/div").nth(0)).to_contain_text("in salary", timeout=15000), "The attendance legend indicates 'Off' days are included in salary."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    