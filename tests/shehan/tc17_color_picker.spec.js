const puppeteer = require('puppeteer');

(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();

    console.log("Running TC17 - Color Picker");

    // Correct URL (tool page itself)
    await page.goto('https://www.pixelssuite.com/color-picker', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // This page already has built-in picker UI (no upload needed based on screenshot)
    // Click inside color area
    await page.mouse.click(320, 610);

    await delay(2000);

    // Read values
    const bodyText = await page.evaluate(() => document.body.innerText);

    if (
      bodyText.includes('#') &&
      bodyText.toLowerCase().includes('rgb')
    ) {
      console.log("✅ TC17 PASSED - HEX / RGB values displayed");
    } else {
      console.log("❌ TC17 FAILED - Color values not shown");
    }

  } catch (error) {
    console.error(error);
    console.log("❌ TC17 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();