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

console.log("Running TC24");

await page.goto('https://www.pixelssuite.com/pdf-editor',{waitUntil:'networkidle2'});

const [chooser]=await Promise.all([
page.waitForFileChooser(),
page.evaluate(()=>{
const b=[...document.querySelectorAll('button')]
.find(x=>x.innerText.toLowerCase().includes('open'));
if(b)b.click();
})
]);

await chooser.accept([path.join(process.cwd(),'sample.pdf')]);

await page.waitForTimeout(8000);

console.log("✅ TC24 PASSED");

}catch(e){
console.log("❌ TC24 FAILED");
console.error(e);
}finally{
await browser.close();
}
})();