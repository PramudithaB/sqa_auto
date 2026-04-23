const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
const browser = await puppeteer.launch({
headless:false,
defaultViewport:null,
args:['--start-maximized']
});

const delay = ms => new Promise(r => setTimeout(r, ms));

try{
const page = await browser.newPage();

console.log("Running TC22 - PDF to Word Workflow");

await page.goto('https://www.pixelssuite.com/pdf-to-word', {
waitUntil:'networkidle2'
});

console.log("Current URL:", page.url());

// Click correct Select PDF button
const [chooser] = await Promise.all([
page.waitForFileChooser({timeout:60000}),
page.evaluate(() => {
const btn = [...document.querySelectorAll('button')]
.find(el => el.innerText.toLowerCase().includes('select pdf'));
if(btn) btn.click();
})
]);

await chooser.accept([
path.join(process.cwd(),'sample.pdf')
]);

await delay(4000);

// Click Convert button
await page.evaluate(() => {
const btn = [...document.querySelectorAll('button')]
.find(el => el.innerText.toLowerCase().includes('convert'));
if(btn) btn.click();
});

await delay(10000);

console.log("✅ TC22 PASSED");

}catch(err){
console.log("❌ TC22 FAILED");
console.error(err);
}finally{
await browser.close();
}
})();