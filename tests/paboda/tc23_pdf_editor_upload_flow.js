const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
headless:false,
defaultViewport:null,
args:['--start-maximized']
});

try{
const page = await browser.newPage();

console.log("Running TC23 - PDF Editor Upload Flow");

await page.goto('https://www.pixelssuite.com/pdf-editor', {
waitUntil:'networkidle2'
});

console.log("Current URL:", page.url());

// Wait for file input
const fileInput = await page.waitForSelector('input[type="file"]', {
timeout:10000
});

// Upload file directly
await fileInput.uploadFile(
path.join(process.cwd(), 'sample.pdf')
);

await delay(8000);

console.log("✅ TC23 PASSED");

}catch(err){
console.log("❌ TC23 FAILED");
console.error(err);
}finally{
await browser.close();
}
})();