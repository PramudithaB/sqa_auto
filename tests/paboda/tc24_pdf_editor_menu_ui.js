const puppeteer = require('puppeteer');

(async () => {
const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
headless: false,
defaultViewport: null,
args: ['--start-maximized']
});

try {
const page = await browser.newPage();

console.log("Running TC24 - PDF Editor UI Stability");

// Direct open PDF Editor page
await page.goto('https://www.pixelssuite.com/pdf-editor', {
waitUntil: 'networkidle2'
});

console.log("Current URL:", page.url());

// Wait for main UI elements
await page.waitForSelector('input[type="file"]', { timeout: 10000 });

// Check toolbar / controls visible
const hasToolbar = await page.evaluate(() => {
const text = document.body.innerText.toLowerCase();
return text.includes('toolbar') || text.includes('page') || text.includes('zoom');
});

if (!hasToolbar) {
throw new Error("Toolbar controls not found");
}

await delay(5000);

console.log("✅ TC24 PASSED");

} catch (e) {
console.log("❌ TC24 FAILED");
console.error(e);
} finally {
await browser.close();
}
})();