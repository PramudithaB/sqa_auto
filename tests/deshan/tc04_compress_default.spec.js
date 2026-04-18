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

    console.log("Running TC04 - Compress Image");

    // Correct URL
    await page.goto('https://www.pixelssuite.com/compress-image', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // Click exact Select files button
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

    console.log("Image uploaded");

    await delay(5000);

    // Try download
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.innerText.toLowerCase().includes('download'));
      if (btn) btn.click();
    });

    console.log("Download clicked");

    await delay(3000);

    // Hidden link click
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

    const files = fs.readdirSync(downloadPath).filter(f =>
      f.endsWith('.jpg') ||
      f.endsWith('.jpeg') ||
      f.endsWith('.png') ||
      f.endsWith('.webp')
    );

    console.log("Downloaded:", files);

    if (files.length > 0) {
      console.log("✅ TC04 PASSED - Compressed file downloaded");
    } else {
      console.log("❌ TC04 FAILED - No compressed file downloaded");
    }

  } catch (error) {
    console.error("Error:", error);
    console.log("❌ TC04 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();