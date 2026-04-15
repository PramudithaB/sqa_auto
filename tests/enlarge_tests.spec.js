const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 150, // ක්‍රියාවලිය බලාගන්න ලේසි වෙන්න slow කළා
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    const downloadPath = path.resolve(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });

    try {
        console.log("Starting: Image Enlarger Test...");
        await page.goto('https://www.pixelssuite.com/resize-image', { waitUntil: 'networkidle2' });

        // 1. Enlarger Tab එකට යාම
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button, a, span'));
            const enlargeTab = tabs.find(t => t.innerText.includes('Enlarger'));
            if (enlargeTab) enlargeTab.click();
        });
        await new Promise(r => setTimeout(r, 2000)); // UI එක load වෙනකම් ඉන්න

        // 2. Upload කිරීම (අනිවාර්යයෙන්ම මේ පියවර විය යුතුයි)
        console.log("Waiting for Select files button...");
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.innerText.includes('Select files'));
                if (btn) btn.click();
                else throw new Error("Select files button not found!");
            }),
        ]);

        const filePath = path.join(process.cwd(), 'test-image.jpg');
        await fileChooser.accept([filePath]);
        console.log("Uploading image...");

        // 3. පින්තූරය upload වී preview එක එනකම් ඉන්න
        // මෙතන තත්පර 5ක් වත් ඉන්න ඕනේ upload එක complete වෙන්න
        await new Promise(r => setTimeout(r, 5000)); 

        // 4. Download button එක click කිරීම
        console.log("Checking for Download button...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const dlBtn = buttons.find(b => b.innerText.toLowerCase().includes('download'));
            if (dlBtn) {
                dlBtn.scrollIntoView();
                dlBtn.click();
            } else {
                throw new Error("Download button not found after upload!");
            }
        });

        console.log("Download clicked. Monitoring folder...");
        await new Promise(r => setTimeout(r, 15000));

        const files = fs.readdirSync(downloadPath);
        console.log("Test Completed. Downloaded files:", files);

    } catch (error) {
        console.error("Test Error:", error.message);
    } finally {
        await browser.close();
    }
})();