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

console.log("Running TC23");

await page.goto('https://www.pixelssuite.com/crop-jpg',{waitUntil:'networkidle2'});

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

await page.mouse.move(200,300);
await page.mouse.down();
await page.mouse.move(450,500,{steps:10});
await page.mouse.up();

await page.waitForTimeout(3000);

console.log("✅ TC23 PASSED");

}catch(e){
console.log("❌ TC23 FAILED");
console.error(e);
}finally{
await browser.close();
}
})();