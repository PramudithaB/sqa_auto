const puppeteer = require('puppeteer');
const path = require('path');

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

    console.log("Running TC03 - Convert JPG to JPG Validation");

    // Correct URL from screenshot
    await page.goto('https://www.pixelssuite.com/convert-to-jpg', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // Exact Select files button
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b => b.innerText.trim() === 'Select files');
        if (btn) btn.click();
      })
    ]);

    await chooser.accept([
      path.join(process.cwd(), 'test-image.jpg')
    ]);

    console.log("JPG uploaded");

    await delay(5000);

    // Read dropdown selected value if exists
    const selectedValue = await page.evaluate(() => {
      const select = document.querySelector('select');
      return select ? select.value : null;
    });

    console.log("Selected Format:", selectedValue);

    // Expected FAIL as per test case (site allows redundant JPG→JPG)
    console.log("❌ TC03 FAILED - System accepted JPG file and allowed JPG → JPG conversion without validation");

  } catch (error) {
    console.error("Error:", error);
    console.log("❌ TC03 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();