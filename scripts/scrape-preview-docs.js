const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = process.env.PREVIEW_DOCS_EMAIL;
const PASSWORD = process.env.PREVIEW_DOCS_PASSWORD;
const BASE_URL = 'https://preview-docs.thoughtspot.com';
const OUTPUT_PATH = path.join(__dirname, '../src/data/preview-release-notes.json');

async function scrape() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Step 1: Go to home page
    console.log('Navigating to preview docs...');
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });

    // Step 2: Click Log In button
    await page.click('a:has-text("Log in"), button:has-text("Log in"), a:has-text("Log In"), button:has-text("Log In")');
    await page.waitForURL(/auth0\.com/, { timeout: 15000 });
    console.log('On Auth0 login page');

    // Step 3: Fill email
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', EMAIL);

    // Step 4: Fill password
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);

    // Step 5: Check terms checkbox if visible
    try {
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible({ timeout: 2000 })) {
        await checkbox.check();
        console.log('Checked terms checkbox');
      }
    } catch { /* no checkbox */ }

    // Step 6: Submit — try multiple selectors
    await Promise.race([
      page.click('button[type="submit"]'),
      page.click('button:has-text("LOG IN")'),
      page.click('button:has-text("Log In")'),
    ]);

    await page.waitForURL(/preview-docs\.thoughtspot\.com/, { timeout: 20000 });
    console.log('Authenticated successfully, URL:', page.url());

    // Step 7: Detect version from URL
    await page.goto(`${BASE_URL}/cloud/latest/notes`, { waitUntil: 'networkidle' });
    const finalUrl = page.url();
    const versionMatch = finalUrl.match(/cloud\/([\d.]+\.cl)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    console.log(`Preview version: ${version}`);

    // Step 8: Get release notes content
    const releaseNotesContent = await page.evaluate(() => document.body.innerText);
    console.log(`Release notes length: ${releaseNotesContent.length} chars`);

    // Step 9: Write output
    const output = {
      version,
      scrapedAt: new Date().toISOString(),
      isDraft: true,
      releaseNotes: releaseNotesContent.substring(0, 30000),
      embeddedNotes: '',
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Saved to ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Scraper failed:', error.message);
    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: '/tmp/scraper-error.png' });
      console.log('Screenshot saved to /tmp/scraper-error.png');
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrape();
