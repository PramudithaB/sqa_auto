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

    console.log("Running TC12 - Crop to WebP");

    await page.goto('https://www.pixelssuite.com/crop-webp', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // exact Select files button
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

    // Crop drag
    await page.mouse.move(350, 500);
    await page.mouse.down();
    await page.mouse.move(520, 650, { steps: 20 });
    await page.mouse.up();

    console.log("Crop selected");

    await delay(3000);

    // Click Download
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.innerText.toLowerCase().includes('download'));
      if (btn) btn.click();
    });

    console.log("Download clicked");

    await delay(3000);

    // Click hidden real link
    const links = await page.$$('a');

    for (const link of links) {
      const href = await page.evaluate(el => el.href, link);

      if (href && (href.includes('blob:') || href.includes('http'))) {
        await link.click();
        console.log("Real file link clicked!");
        break;
      }
    }

    await delay(8000);

    const files = fs.readdirSync(downloadPath)
      .filter(f => f.endsWith('.webp'));

    console.log("Downloaded:", files);

    if (files.length > 0) {
      console.log("✅ TC12 PASSED - Cropped WebP downloaded");
    } else {
      console.log("❌ TC12 FAILED - WebP not downloaded");
    }

  } catch (error) {
    console.error("Error:", error);
    console.log("❌ TC12 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();