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
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Go directly to the release notes page — this will trigger auth redirect
    console.log('Navigating directly to release notes...');
    await page.goto(NOTES_URL, { waitUntil: 'networkidle' });
    console.log('Current URL after initial nav:', page.url());

    // Step 2: If redirected to auth0, log in
    if (page.url().includes('auth0.com') || page.url().includes('preview-docs.thoughtspot.com/home')) {
      console.log('Auth required, logging in...');

      // If we're on the home page with a Log In button, click it first
      if (page.url().includes('/home')) {
        await page.click('a:has-text("Log in"), button:has-text("Log in"), a:has-text("Log In"), button:has-text("Log In")');
        await page.waitForURL(/auth0\.com/, { timeout: 15000 });
      }

      // Fill auth0 form
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await page.fill('input[type="email"], input[name="email"]', EMAIL);
      await page.fill('input[type="password"], input[name="password"]', PASSWORD);

      // Check terms checkbox if present
      try {
        const checkbox = page.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 2000 })) {
          await checkbox.check();
          console.log('Checked terms checkbox');
        }
      } catch { /* no checkbox */ }

      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForURL(/preview-docs\.thoughtspot\.com/, { timeout: 20000 });
      console.log('Authenticated, URL:', page.url());

      // Step 3: Now navigate directly to release notes
      console.log('Navigating to release notes after auth...');
      await page.goto(NOTES_URL, { waitUntil: 'networkidle' });
      console.log('Release notes URL:', page.url());
    }

    // Step 4: Verify we're on the right page
    const currentUrl = page.url();
    if (!currentUrl.includes('preview-docs.thoughtspot.com/cloud')) {
      throw new Error(`Landed on wrong page after auth: ${currentUrl}`)
    }

    // Step 5: Extract version from URL
    const versionMatch = currentUrl.match(/cloud\/([\d.]+\.cl)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    console.log(`Preview version: ${version}`);

    // Step 6: Get page content
    const releaseNotesContent = await page.evaluate(() => document.body.innerText);
    console.log(`Content length: ${releaseNotesContent.length} chars`);
    console.log(`Content preview: ${releaseNotesContent.substring(0, 200)}`);

    if (releaseNotesContent.length < 500) {
      throw new Error('Content too short — likely got wrong page')
    }

    // Step 7: Write output
    const output = {
      version,
      scrapedAt: new Date().toISOString(),
      isDraft: true,
      releaseNotes: releaseNotesContent.substring(0, 30000),
      embeddedNotes: '',
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Saved successfully. Version: ${version}, Length: ${output.releaseNotes.length}`);

  } catch (error) {
    console.error('Scraper failed:', error.message);
    try {
      await page.screenshot({ path: '/tmp/scraper-error.png', fullPage: true });
      console.log('Screenshot saved to /tmp/scraper-error.png');
      console.log('Page URL at failure:', page.url());
      const content = await page.evaluate(() => document.body.innerText);
      console.log('Page content at failure (first 500 chars):', content.substring(0, 500));
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrape();
