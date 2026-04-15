const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    // 1. Launch Browser with macOS fixes
    const browser = await puppeteer.launch({
        headless: false, 
        slowMo: 100,    
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setBypassCSP(true);

    const downloadPath = path.resolve(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath,
    });

    async function waitForNewDownload(initialFiles, timeoutMs = 30000) {
        const initialSet = new Set(initialFiles);
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const currentFiles = fs.readdirSync(downloadPath);
            const newFiles = currentFiles.filter(f => !initialSet.has(f));
            if (newFiles.length > 0) return newFiles;
            await new Promise(r => setTimeout(r, 1000));
        }
        throw new Error(`No new download file appeared in ${downloadPath} within ${timeoutMs}ms`);
    }

    try {
        console.log("Running Test Case: TC07 - Resize image");
        
        await page.goto('https://www.pixelssuite.com/resize-image', { waitUntil: 'networkidle2' });

        await page.waitForSelector('button');

        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const selectBtn = buttons.find(b => b.innerText.includes('Select files'));
                if (selectBtn) selectBtn.click();
                else throw new Error("Select files button not found!");
            }),
        ]);

        const filePath = path.join(process.cwd(), 'test-image.jpg');
        await fileChooser.accept([filePath]);
        console.log("Image uploaded successfully!");

        await new Promise(r => setTimeout(r, 2000));

        await page.waitForSelector('input[type="number"]');
        await page.click('input[type="number"]', { clickCount: 3 });
        await page.type('input[type="number"]', '800');
        console.log("Width set to 800");

        const beforeFiles = fs.readdirSync(downloadPath);
        
        // Use Promise.all to wait during download and keep browser open
        await Promise.all([
            page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const downloadBtn = buttons.find(b => b.innerText.includes('Download'));
                if (downloadBtn) downloadBtn.click();
            }),
            new Promise(resolve => setTimeout(resolve, 15000))
        ]);
        console.log("Download button clicked! Waiting for file to finish...");

        const downloadedFiles = await waitForNewDownload(beforeFiles, 30000);
        console.log("Download completed. Files in folder:", downloadedFiles);

    } catch (error) {
        console.error("Something went wrong:", error);
    } finally {
        await browser.close();
    }
})();