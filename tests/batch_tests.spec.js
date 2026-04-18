const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const downloadPath = path.join(process.cwd(), 'downloads');

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath
    });

    console.log("Running Test Case: TC08 - Bulk Image Resize");

    // Bulk Resize page
    await page.goto('https://www.pixelssuite.com/bulk-resize', {
      waitUntil: 'networkidle2'
    });

    console.log("Opening bulk upload...");

    // Upload multiple images at once
    const filesToUpload = [
      path.join(process.cwd(), 'test-image.jpg'),
      path.join(process.cwd(), 'test-image2.jpg')
    ];

    const [chooser] = await Promise.all([
      page.waitForFileChooser(),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b =>
            b.innerText.toLowerCase().includes('select') ||
            b.innerText.toLowerCase().includes('upload')
          );

        if (btn) btn.click();
      })
    ]);

    await chooser.accept(filesToUpload);

    console.log("Bulk images uploaded successfully!");

    await delay(5000);

    // Set width if field exists
    const input = await page.$('input[type="number"]');

    if (input) {
      await input.click({ clickCount: 3 });
      await input.press('Backspace');
      await input.type('1024');
      console.log("Bulk Width set to 1024px");
    } else {
      console.log("Width input not found - skipped");
    }

    await delay(3000);

    // Click resize / process button
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b =>
          b.innerText.toLowerCase().includes('resize') ||
          b.innerText.toLowerCase().includes('convert') ||
          b.innerText.toLowerCase().includes('download')
        );

      if (btn) btn.click();
    });

    console.log("Bulk process button clicked!");

    await delay(5000);

    // Click actual file link if generated
    const links = await page.$$('a');

    for (const link of links) {
      const href = await page.evaluate(el => el.href, link);

      if (href && (href.includes('blob:') || href.includes('http'))) {
        await link.click();
        console.log("Real bulk file link clicked!");
        break;
      }
    }

    await delay(8000);

    const files = fs.readdirSync(downloadPath);

    const downloaded = files.filter(file =>
      file.endsWith('.jpg') ||
      file.endsWith('.jpeg') ||
      file.endsWith('.png') ||
      file.endsWith('.zip')
    );

    console.log("Downloaded files:", downloaded);

    if (downloaded.length > 0) {
      console.log("✅ TC08 PASSED - Bulk image resize completed successfully");
    } else {
      console.log("❌ TC08 FAILED - Bulk image resize did not generate downloadable output");
    }

  } catch (error) {
    console.error("Bulk Test Error:", error);
    console.log("❌ TC08 FAILED - Error during bulk image resize flow");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();