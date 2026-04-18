const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const downloadPath = path.join(process.cwd(), 'downloads');

  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath
    });

    console.log("Running TC13 - Rotate Image");

    // Correct URL from screenshot
    await page.goto('https://www.pixelssuite.com/rotate-image', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // Select files
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b => b.innerText.trim().includes('Select'));
        if (btn) btn.click();
      })
    ]);

    await chooser.accept([
      path.join(process.cwd(), 'test-image.jpg')
    ]);

    console.log("Image uploaded");

    await delay(5000);

    // Rotate 90 button
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b =>
          b.innerText.includes('90') ||
          b.innerText.includes('↻') ||
          b.innerText.toLowerCase().includes('rotate')
        );
      if (btn) btn.click();
    });

    console.log("Rotate clicked");

    await delay(3000);

    // Download
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.innerText.toLowerCase().includes('download'));
      if (btn) btn.click();
    });

    await delay(3000);

    // Real link
    const links = await page.$$('a');
    for (const link of links) {
      const href = await page.evaluate(el => el.href, link);
      if (href && (href.includes('blob:') || href.includes('http'))) {
        await link.click();
        break;
      }
    }

    await delay(8000);

    const files = fs.readdirSync(downloadPath);
    console.log("Downloaded:", files);

    console.log("✅ TC13 PASSED - Rotated image downloaded");

  } catch (error) {
    console.error("Error:", error);
    console.log("❌ TC13 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();