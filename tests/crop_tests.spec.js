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
        console.log("Running Test Case: TC10 - Crop Image");
        
        // 3. Navigate to Resize/Crop Page
        await page.goto('https://www.pixelssuite.com/resize-image', { waitUntil: 'networkidle2' });

        // 4. Image එක upload කිරීම
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Select files'));
                if (btn) btn.click();
            }),
        ]);
        
        const filePath = path.join(process.cwd(), 'test-image.jpg'); 
        await fileChooser.accept([filePath]);
        console.log("Image uploaded for cropping...");

        // 5. Config options එනකම් සහ Crop tab එක පෙනෙන තෙක් රැඳී සිටීම
        await new Promise(r => setTimeout(r, 3000));

        // 6. "Crop" tab එක හෝ button එක click කිරීම
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const cropBtn = buttons.find(b => b.innerText.trim() === 'Crop');
            if (cropBtn) cropBtn.click();
            else console.log("Crop button not found, might already be on crop view");
        });
        console.log("Switched to Crop mode");

        const beforeFiles = fs.readdirSync(downloadPath);
        
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const downloadBtn = buttons.find(b => b.innerText.toLowerCase().includes('download'));
            if (downloadBtn) {
                downloadBtn.scrollIntoView();
                downloadBtn.click();
            } else {
                throw new Error("Download button not found!");
            }
        });

        await new Promise(r => setTimeout(r, 15000));
        console.log("Crop Download Clicked! Waiting for file to finish...");

        const downloadedFiles = await waitForNewDownload(beforeFiles, 30000);
        
        const files = fs.readdirSync(downloadPath);
        console.log("Test Finished! Files in download folder:", files);

    } catch (error) {
        console.error("Crop Test failed:", error);
    } finally {
        await browser.close();
    }
})();