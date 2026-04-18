const puppeteer=require('puppeteer');
const path=require('path');

(async()=>{
const browser=await puppeteer.launch({
headless:false,
defaultViewport:null,
args:['--start-maximized']
});

try{
const page=await browser.newPage();

console.log("Running TC22");

await page.goto('https://www.pixelssuite.com/resize-image',{waitUntil:'networkidle2'});

const [chooser]=await Promise.all([
page.waitForFileChooser(),
page.evaluate(()=>{
const b=[...document.querySelectorAll('button')]
.find(x=>x.innerText.includes('Select'));
if(b)b.click();
})
]);

await chooser.accept([path.join(process.cwd(),'test-image.jpg')]);

await page.waitForTimeout(4000);

const inputs=await page.$$('input[type="number"]');

await inputs[0].click({clickCount:3});
await inputs[0].type('5000');

await inputs[1].click({clickCount:3});
await inputs[1].type('5000');

await page.waitForTimeout(3000);

console.log("✅ TC22 PASSED");

}catch(e){
console.log("❌ TC22 FAILED");
console.error(e);
}finally{
await browser.close();
}
})();