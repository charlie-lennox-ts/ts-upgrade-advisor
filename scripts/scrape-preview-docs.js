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
    // Step 1: Go to the home page which redirects to Auth0
    console.log('Navigating to preview docs...');
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });

    // Step 2: Click Log In
    await page.click('text=Log in');
    await page.waitForURL(/auth0\.com/);

    // Step 3: Fill in Auth0 form
    console.log('Authenticating...');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="example"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password"]', PASSWORD);

    // Check the terms of service checkbox if present
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Click log in
    await page.click('text=LOG IN, button[type="submit"]');
    await page.waitForURL(/preview-docs\.thoughtspot\.com/, { timeout: 15000 });
    console.log('Authenticated successfully');

    // Step 4: Detect the latest preview version from the page
    const currentUrl = page.url();
    let version = null;

    // Try to find version in URL or page content
    const versionMatch = currentUrl.match(/cloud\/([\d.]+\.cl)/);
    if (versionMatch) {
      version = versionMatch[1];
    } else {
      // Navigate to latest and detect version
      await page.goto(`${BASE_URL}/cloud/latest/notes`, { waitUntil: 'networkidle' });
      const finalUrl = page.url();
      const urlMatch = finalUrl.match(/cloud\/([\d.]+\.cl)/);
      if (urlMatch) version = urlMatch[1];
    }

    console.log(`Detected preview version: ${version}`);

    // Step 5: Fetch the main release notes page
    await page.goto(`${BASE_URL}/cloud/latest/notes`, { waitUntil: 'networkidle' });
    const releaseNotesContent = await page.evaluate(() => document.body.innerText);

    // Step 6: Fetch the developer embedded what's new if available
    let embeddedContent = '';
    try {
      await page.goto(`${BASE_URL}/cloud/latest/notes#developer`, { waitUntil: 'networkidle' });
      embeddedContent = await page.evaluate(() => document.body.innerText);
    } catch {
      console.log('No separate embedded section found');
    }

    // Step 7: Write output
    const output = {
      version: version || 'unknown',
      scrapedAt: new Date().toISOString(),
      isDraft: true,
      releaseNotes: releaseNotesContent.substring(0, 30000),
      embeddedNotes: embeddedContent.substring(0, 10000),
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Preview notes saved to ${OUTPUT_PATH}`);
    console.log(`Version: ${output.version}, Length: ${output.releaseNotes.length} chars`);

  } catch (error) {
    console.error('Scraper failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrape();
