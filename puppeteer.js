const puppeteer = require('puppeteer');


(async () => {
  

  const browser = await puppeteer.launch(
    { 

      // default: true  
      headless: false, 

      // default: Chronium 
      // 'C:\\node\\nodeTest\\node_modules\\puppeteer\\.local-chromium\\win64-536395\\chrome-win32\\chrome.exe'
      executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

    } 
  );

  const page = await browser.newPage();
  
  await page.setViewport(
    {
      width: 2560,
      height: 1440    
    }
  );

  await page.goto('https://watt.azets.com');


  await aoiLogin(page);

  await browser.close();

})();



async function aoiLogin(page){

  await page.focus('#username');
  await page.keyboard.type('dan');

  await page.focus('#password');
  await page.keyboard.type('nei');

  await page.click("#signInButton");
  // ***** end Sign in *****


  await page.waitForSelector('#wattRedirect');
  await page.click("#wattRedirect");
  
  await page.waitForSelector('#container');


  await page.screenshot(
    {
      path: 'screenshot.png',
      fullPage: true
    }
  );

};