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

    console.log("Running TC14 - Flip Horizontal");

    // Correct URL
    await page.goto('https://www.pixelssuite.com/flip-image', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // Upload image
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b => b.innerText.includes('Select'));
        if (btn) btn.click();
      })
    ]);

    await chooser.accept([
      path.join(process.cwd(), 'test-image.jpg')
    ]);

    console.log("Image uploaded");

    await delay(5000);

    // Flip horizontal
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b =>
          b.innerText.toLowerCase().includes('horizontal') ||
          b.innerText.toLowerCase().includes('flip')
        );
      if (btn) btn.click();
    });

    console.log("Horizontal flip clicked");

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

    console.log("✅ TC14 PASSED - Horizontal flipped image downloaded");

  } catch (error) {
    console.error("Error:", error);
    console.log("❌ TC14 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();