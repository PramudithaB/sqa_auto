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

    console.log("Running TC19 - Convert Multiple Images to PDF");

    await page.goto('https://www.pixelssuite.com/image-to-pdf', {
      waitUntil: 'networkidle2'
    });

    // Upload multiple images
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

    await chooser.accept([
      path.join(process.cwd(), 'test-image.jpg'),
      path.join(process.cwd(), 'test-image2.jpg')
    ]);

    console.log("Images uploaded");

    await delay(5000);

    // Click Multiple Pages if exists
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b =>
          b.innerText.toLowerCase().includes('multiple') ||
          b.innerText.toLowerCase().includes('pages')
        );
      if (btn) btn.click();
    });

    await delay(2000);

    // Click Create PDF
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b =>
          b.innerText.toLowerCase().includes('create pdf') ||
          b.innerText.toLowerCase().includes('create')
        );
      if (btn) btn.click();
    });

    console.log("Create PDF clicked");

    await delay(10000);

    const files = fs.readdirSync(downloadPath)
      .filter(f => f.toLowerCase().endsWith('.pdf'));

    if (files.length > 0) {
      console.log("Downloaded:", files);
      console.log("✅ TC19 PASSED - PDF created successfully");
    } else {
      console.log("❌ TC19 FAILED - PDF not downloaded");
    }

  } catch (error) {
    console.error(error);
    console.log("❌ TC19 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();