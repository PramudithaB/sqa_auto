const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: true, args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.goto('https://www.pixelssuite.com/resize-image', {waitUntil:'networkidle2'});
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser({timeout: 10000}),
    page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Select files'));
      if (btn) btn.click();
    })
  ]);
  await fileChooser.accept([path.resolve(process.cwd(), 'test-image.jpg')]);
  await new Promise(resolve => setTimeout(resolve, 5000));
  const btns = await page.$$eval('button', bs => bs.map(b => ({text: b.innerText.trim(), disabled: b.disabled, classes: b.className, outer: b.outerHTML})).slice(0,50));
  const downloadButtonDetails = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Download'));
    if (!btn) return null;
    let parent = btn.parentElement;
    const parents = [];
    for (let i = 0; i < 3 && parent; i++, parent = parent.parentElement) {
      parents.push(parent.outerHTML.slice(0, 500));
    }
    return {
      outerHTML: btn.outerHTML,
      parentHTMLs: parents,
      nextSibling: btn.nextElementSibling ? btn.nextElementSibling.outerHTML : null,
      prevSibling: btn.previousElementSibling ? btn.previousElementSibling.outerHTML : null,
    };
  });
  const anchors = await page.$$eval('a', as => as.map(a => ({text: a.innerText.trim(), href: a.href, outer: a.outerHTML.slice(0,200)})).slice(0,50));
  const inputs = await page.$$eval('input', ins => ins.map(i => ({type: i.type, name: i.name, value: i.value, placeholder: i.placeholder})).slice(0,50));
  console.log('download button details:', JSON.stringify(downloadButtonDetails, null, 2));
  console.log('buttons after upload:', JSON.stringify(btns, null, 2));
  console.log('anchors after upload:', JSON.stringify(anchors, null, 2));
  console.log('inputs after upload:', JSON.stringify(inputs, null, 2));
  const downloadPath = path.resolve(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });
  const before = fs.readdirSync(downloadPath);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Download'));
    if (btn) {
      btn.scrollIntoView();
      btn.click();
    }
  });
  await new Promise(resolve => setTimeout(resolve, 10000));
  const after = fs.readdirSync(downloadPath);
  console.log('download folder before:', before);
  console.log('download folder after:', after);
  await browser.close();
})();
