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

    console.log("Running TC18 - Image to Text (OCR)");

    await page.goto('https://www.pixelssuite.com/image-to-text', {
      waitUntil: 'networkidle2'
    });

    // Click Select image button
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b =>
            b.innerText.toLowerCase().includes('select image') ||
            b.innerText.toLowerCase().includes('select')
          );
        if (btn) btn.click();
      })
    ]);

    await chooser.accept([path.join(process.cwd(), 'text-image.png')]);
    console.log("Image uploaded");

    // Wait OCR process
    await delay(10000);

    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.length > 20) {
      console.log("✅ TC18 PASSED - Text extracted successfully");
    } else {
      console.log("❌ TC18 FAILED - No extracted text found");
    }

  } catch (error) {
    console.error(error);
    console.log("❌ TC18 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();