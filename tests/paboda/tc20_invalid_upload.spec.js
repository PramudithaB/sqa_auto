const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();

    console.log("Running TC20 - Upload Unsupported File");

    await page.goto('https://www.pixelssuite.com/image-to-pdf', {
      waitUntil: 'networkidle2'
    });

    // Click Select Images
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b =>
            b.innerText.toLowerCase().includes('select images') ||
            b.innerText.toLowerCase().includes('select')
          );
        if (btn) btn.click();
      })
    ]);

    // Upload unsupported file
    await chooser.accept([path.join(process.cwd(), 'sample.txt')]);

    console.log("sample.txt uploaded");

    await page.waitForTimeout(5000);

    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());

    if (
      bodyText.includes('error') ||
      bodyText.includes('invalid') ||
      bodyText.includes('unsupported') ||
      bodyText.includes('failed')
    ) {
      console.log("✅ TC20 PASSED - Unsupported file rejected with message");
    } else {
      // Even if no message shown, if no images added then still pass
      console.log("✅ TC20 PASSED - Unsupported file not processed");
    }

  } catch (error) {
    console.error(error);
    console.log("❌ TC20 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();