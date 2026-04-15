const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    // 1. Launch Browser with macOS fixes
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // CRITICAL: Set download behavior immediately after page creation
    const downloadPath = path.resolve('./downloads');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }

    await page._client().send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath,
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
        console.log("Running Test Case: TC08 - Batch Resize (Multiple Images)");
        
        // 3. Navigate to Resize Page
        await page.goto('https://www.pixelssuite.com/resize-image', { waitUntil: 'networkidle2' });

        // 4. Batch Upload
        console.log("Starting Batch Upload...");
        const filesToUpload = [
            path.join(process.cwd(), 'test-image.jpg'),
            path.join(process.cwd(), 'test-image2.jpg')
        ];

        for (const filePath of filesToUpload) {
            const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.evaluate(() => {
                    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Select files'));
                    if (btn) btn.click();
                }),
            ]);
            await fileChooser.accept([filePath]);
            console.log(`Uploaded: ${path.basename(filePath)}`);
            await new Promise(r => setTimeout(r, 1500));
        }

        console.log("All images uploaded successfully!");

        // 5. Config එක දිස්වන තුරු රැඳී සිටීම
        await new Promise(r => setTimeout(r, 3000));

        // 6. Width එක 1024px ලෙස සැකසීම
        await page.waitForSelector('input[type="number"]');
        await page.click('input[type="number"]', { clickCount: 3 });
        await page.type('input[type="number"]', '1024');
        console.log("Batch Width set to 1024px");

        const beforeFiles = fs.readdirSync(downloadPath);
        
        // Use Promise.all to wait during download and keep browser open
        await Promise.all([
            page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const downloadBtn = buttons.find(b => b.innerText.toLowerCase().includes('download'));
                if (downloadBtn) {
                    downloadBtn.scrollIntoView();
                    downloadBtn.click();
                } else {
                    throw new Error("Download button not found!");
                }
            }),
            new Promise(resolve => setTimeout(resolve, 10000))
        ]);

        console.log("Batch Download Clicked! Waiting for network idle...");

        // Wait for network idle to ensure data transfer completes
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});

        const downloadedFiles = await waitForNewDownload(beforeFiles, 30000);
        
        const files = fs.readdirSync(downloadPath);
        if (files.length > 0) {
            console.log("Success! Files found in downloads folder:", files);
        } else {
            console.log("Warning: Download clicked but no files found in folder.");
        }

    } catch (error) {
        console.error("Batch Test failed:", error);
    } finally {
        await browser.close();
    }
})();