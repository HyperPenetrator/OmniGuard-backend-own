const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const networkLogs = [];

  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });

  page.on('request', request => {
    networkLogs.push(`>> ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    networkLogs.push(`<< ${response.status()} ${response.url()}`);
  });

  page.on('requestfailed', request => {
    networkLogs.push(`!! FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('Navigating to https://omniguard-suite.vercel.app/ ...');
    await page.goto('https://omniguard-suite.vercel.app/', { waitUntil: 'networkidle' });
    
    console.log('Navigating to /report...');
    await page.click('button:has-text("Report Emergency")');

    await page.waitForTimeout(1000);
    console.log('Clicking Fire...');
    await page.click('button:has-text("Fire")');

    console.log('Filling Location...');
    await page.fill('textarea[placeholder*="street"]', 'Playwright Automated Test Location');
    await page.click('button:has-text("Confirm Location")');

    console.log('Filling Details...');
    await page.waitForTimeout(1000);
    await page.fill('textarea[placeholder*="E.g., number"]', 'Manual test of public SOS flow.');
    
    console.log('Clicking Send SOS Now...');
    await page.click('button:has-text("Send SOS Now")');
    
    // Wait longer for potential cold start
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: 'post_submission.png' });

  } catch (err) {
    console.error('Test script encountered an error:', err);
  } finally {
    console.log('\n--- NETWORK LOGS ---');
    networkLogs.forEach(log => console.log(log));
    
    await browser.close();
  }
})();
