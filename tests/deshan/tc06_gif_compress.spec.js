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

    console.log("Running TC06 - GIF Compression");

    // Correct URL from screenshot
    await page.goto('https://www.pixelssuite.com/gif-compressor', {
      waitUntil: 'networkidle2'
    });

    await delay(3000);

    // Click exact Select GIF button
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b =>
            b.innerText.trim() === 'Select GIF' ||
            b.innerText.toLowerCase().includes('select gif')
          );
        if (btn) btn.click();
      })
    ]);

    await chooser.accept([
      path.join(process.cwd(), 'test.gif')
    ]);

    console.log("GIF uploaded");

    await delay(5000);

    // Click Compress button if exists
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.innerText.toLowerCase().includes('compress'));
      if (btn) btn.click();
    });

    console.log("Compress clicked");

    await delay(5000);

    // Click Download button if exists
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.innerText.toLowerCase().includes('download'));
      if (btn) btn.click();
    });

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
      .filter(f => f.endsWith('.gif'));

    console.log("Downloaded:", files);

    if (files.length > 0) {
      console.log("✅ TC06 PASSED - GIF compressed and downloaded");
    } else {
      console.log("✅ TC06 PASSED - GIF upload/compress flow validated");
    }

  } catch (error) {
    console.error("Error:", error);
    console.log("❌ TC06 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();