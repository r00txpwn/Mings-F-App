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
        
        # -> Open the Staff cockpit view by navigating to /spec-ops?screen=staff (staff cockpit with screen=staff).
        await page.goto("http://localhost:4175/spec-ops?screen=staff")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Email Address' and 'Password' fields with the provided credentials and click the 'Sign In' button.
        # user@example.com email field
        elem = page.get_by_placeholder('user@example.com', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@system.local")
        
        # -> Fill the 'Email Address' and 'Password' fields with the provided credentials and click the 'Sign In' button.
        # •••••••• password field
        elem = page.get_by_placeholder('••••••••', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin123")
        
        # -> Fill the 'Email Address' and 'Password' fields with the provided credentials and click the 'Sign In' button.
        # Sign In button
        elem = page.get_by_role('button', name='Sign In', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Home' navigation item in the left sidebar to open the Home section.
        # Home button
        elem = page.get_by_role('button', name='Home', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the home dashboard is displayed
        # Assert: URL includes 'screen=home', confirming the Home dashboard route.
        await expect(page).to_have_url(re.compile("screen=home"), timeout=15000), "URL includes 'screen=home', confirming the Home dashboard route."
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[1]/div[1]/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Period' control is visible on the Home dashboard.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[1]/div[1]/div[1]/span").nth(0)).to_be_visible(timeout=15000), "The 'Period' control is visible on the Home dashboard."
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[1]/div[1]/div[2]/div[1]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'This month' period button is visible on the Home dashboard.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[1]/div[1]/div[2]/div[1]/button[1]").nth(0)).to_be_visible(timeout=15000), "The 'This month' period button is visible on the Home dashboard."
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[4]/section[2]/div[1]/div/div/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: An 'Orders' KPI control is visible on the Home dashboard, indicating KPI-style content is present.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[4]/section[2]/div[1]/div/div/button[1]").nth(0)).to_be_visible(timeout=15000), "An 'Orders' KPI control is visible on the Home dashboard, indicating KPI-style content is present."
        
        # --> Verify KPI-style content is displayed
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[1]/div[1]/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: The dashboard 'Period' label is visible, indicating the home KPI view is shown.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[1]/div[1]/div[1]/span").nth(0)).to_be_visible(timeout=15000), "The dashboard 'Period' label is visible, indicating the home KPI view is shown."
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[4]/section[2]/div[1]/div/div/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Orders' KPI/control is visible on the Home dashboard.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[4]/section[2]/div[1]/div/div/button[1]").nth(0)).to_be_visible(timeout=15000), "The 'Orders' KPI/control is visible on the Home dashboard."
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[4]/section[2]/div[1]/div/div/button[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'AOV' KPI/control is visible on the Home dashboard.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[4]/section[2]/div[1]/div/div/button[2]").nth(0)).to_be_visible(timeout=15000), "The 'AOV' KPI/control is visible on the Home dashboard."
        await page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[2]/div[8]/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: A KPI percentage value (0.0%) is displayed on the dashboard.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/main/div/div/div[2]/div[8]/div[1]/span").nth(0)).to_be_visible(timeout=15000), "A KPI percentage value (0.0%) is displayed on the dashboard."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    