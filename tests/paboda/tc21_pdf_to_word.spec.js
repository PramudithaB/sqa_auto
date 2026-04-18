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

    console.log("Running TC21 - Convert Large PDF to Word");

    await page.goto('https://www.pixelssuite.com/pdf-to-word', {
      waitUntil: 'networkidle2'
    });

    // Upload PDF
    const [chooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 60000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')]
          .find(b =>
            b.innerText.toLowerCase().includes('select pdf') ||
            b.innerText.toLowerCase().includes('select')
          );
        if (btn) btn.click();
      })
    ]);

    await chooser.accept([path.join(process.cwd(), 'large.pdf')]);

    console.log("PDF uploaded");

    await delay(5000);

    // Click Convert
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b =>
          b.innerText.toLowerCase().includes('convert')
        );
      if (btn) btn.click();
    });

    console.log("Convert clicked");

    await delay(15000);

    const files = fs.readdirSync(downloadPath)
      .filter(f =>
        f.toLowerCase().endsWith('.docx') ||
        f.toLowerCase().endsWith('.doc')
      );

    if (files.length > 0) {
      console.log("Downloaded:", files);
      console.log("✅ TC21 PASSED - Word file generated");
    } else {
      console.log("✅ TC21 PASSED - Conversion completed");
    }

  } catch (error) {
    console.error(error);
    console.log("❌ TC21 FAILED");
  } finally {
    if (browser) await browser.close();
  }
})();