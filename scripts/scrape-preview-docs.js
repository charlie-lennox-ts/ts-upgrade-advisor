const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = process.env.PREVIEW_DOCS_EMAIL;
const PASSWORD = process.env.PREVIEW_DOCS_PASSWORD;
const NOTES_URL = 'https://preview-docs.thoughtspot.com/cloud/latest/notes';
const OUTPUT_PATH = path.join(__dirname, '../src/data/preview-release-notes.json');

async function scrape() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Go directly to notes URL — Auth0 will intercept
    console.log('Navigating to release notes...');
    await page.goto(NOTES_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('URL after initial nav:', page.url());

    // Handle cookie consent if present
    try {
      const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Accept all"), button:has-text("I agree")').first()
      if (await acceptBtn.isVisible({ timeout: 3000 })) {
        await acceptBtn.click()
        console.log('Dismissed cookie consent')
        await page.waitForTimeout(1000)
      }
    } catch { /* no cookie banner */ }

    // If on home page, click Log In
    if (page.url().includes('/home') || page.url().includes('preview-docs.thoughtspot.com') && !page.url().includes('auth0')) {
      console.log('On home page, clicking Log In...')
      await page.waitForSelector('a, button', { timeout: 10000 })
      const loginBtn = page.locator('a:has-text("Log in"), button:has-text("Log in"), a:has-text("Log In"), button:has-text("Log In")').first()
      await loginBtn.click()
      await page.waitForURL(/auth0\.com/, { timeout: 15000 })
    }

    // Wait for Auth0 form to fully load
    console.log('Waiting for Auth0 form, URL:', page.url())
    await page.waitForLoadState('networkidle', { timeout: 20000 })

    // Handle cookie consent on Auth0 page too
    try {
      const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Accept all")').first()
      if (await acceptBtn.isVisible({ timeout: 2000 })) {
        await acceptBtn.click()
        await page.waitForTimeout(500)
      }
    } catch { /* no cookie banner */ }

    // Wait for email field with multiple possible selectors
    console.log('Looking for email input...')
    await page.waitForSelector(
      'input[type="email"], input[name="email"], input[id="email"], input[placeholder*="email" i], input[placeholder*="example" i]',
      { timeout: 15000 }
    )

    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first()

    console.log('Filling credentials...')
    await emailInput.fill(EMAIL)
    await page.waitForTimeout(500)
    await passwordInput.fill(PASSWORD)
    await page.waitForTimeout(500)

    // Check terms checkbox if present
    try {
      const checkbox = page.locator('input[type="checkbox"]').first()
      if (await checkbox.isVisible({ timeout: 2000 })) {
        await checkbox.check()
        console.log('Checked terms checkbox')
      }
    } catch { /* no checkbox */ }

    // Submit — try multiple approaches
    console.log('Submitting form...')
    try {
      await page.click('button[type="submit"]', { timeout: 5000 })
    } catch {
      try {
        await page.locator('button:has-text("LOG IN"), button:has-text("Log In"), button:has-text("Sign in")').first().click()
      } catch {
        await page.keyboard.press('Enter')
      }
    }

    // Wait for redirect back to preview docs
    await page.waitForURL(/preview-docs\.thoughtspot\.com\/cloud/, { timeout: 30000 })
    console.log('Authenticated! URL:', page.url())

    // Detect version from URL
    const finalUrl = page.url()
    const versionMatch = finalUrl.match(/cloud\/([\d.]+\.cl)/)
    const version = versionMatch ? versionMatch[1] : 'unknown'
    console.log('Detected version:', version)

    // Get page content
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    const content = await page.evaluate(() => document.body.innerText)
    console.log('Content length:', content.length)

    if (content.length < 500) {
      throw new Error(`Content too short (${content.length} chars) — likely wrong page`)
    }

    const output = {
      version,
      scrapedAt: new Date().toISOString(),
      isDraft: true,
      releaseNotes: content.substring(0, 30000),
      embeddedNotes: '',
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
    console.log(`Saved. Version: ${version}, Length: ${output.releaseNotes.length}`)

  } catch (error) {
    console.error('Scraper failed:', error.message)
    try {
      await page.screenshot({ path: '/tmp/scraper-error.png', fullPage: true })
      console.log('Screenshot saved')
      console.log('URL at failure:', page.url())
      const html = await page.content()
      console.log('Page HTML snippet:', html.substring(0, 1000))
    } catch (e) {
      console.error('Could not take screenshot:', e.message)
    }
    process.exit(1)
  } finally {
    await browser.close()
  }
}

scrape()
