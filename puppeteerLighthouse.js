const puppeteer = require('puppeteer');

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const fs = require('fs');
const request = require('request-promise');

async function launchChromeAndRunLighthouse(startingUrl, port, loginFunction){

  // 1. Launch Chrome
  const chrome = await chromeLauncher.launch( 
    { 
      // Chrome debugging port 
      // Equivalent to "chrome.exe --remote-debugging-port=9222"
      port: port,

      enableExtensions: true,

      startingUrl: startingUrl,
      
      chromePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' 
    } 
  );

  console.log(`1. Started browser with debugging port: ${chrome.port}`);
  

  // 2. Get WebSocket Url for puppeteer browser from
  // http://localhost:9222/json/version  
  const webSocketInfo = await request(
    `http://localhost:${chrome.port}/json/version`, 
    response => response
  );

  //console.log('Response ', JSON.parse(webSocketInfo));
  const { webSocketDebuggerUrl } = JSON.parse(webSocketInfo);
  console.log(`2. Get webSocketDebuggerUrl: ${webSocketDebuggerUrl}`);


  // 3. Launch puppeteer for existing browser (web socket endpoint)
  console.log('3. Connect puppeteer to webSocketDebuggerUrl');
  
  const browser = await puppeteer.connect(
    {
      browserWSEndpoint: webSocketDebuggerUrl,
    }
  );

  // 4. Execute UI actions in browser via puppeteer
  const page = (await browser.pages())[0];

  await loginFunction(page);   

  // 5. Run lighthouse audit on browser debugging port
  console.log('5. Run lighthouse audit');

  const lhr = await lighthouse(
    'http://www.yahoo.com', 
    { 
      port: chrome.port,
      output: 'json' 
    },
    null
  );
    
  console.log(`Lighthouse score: ${lhr.score}`);
  
  // The gathered artifacts are typically removed as they can be quite large (~50MB+)
  //delete lhr.artifacts;

  await browser.disconnect();
  
  await chrome.kill();

  console.log('Report created: report.json');

  return lhr;
};



async function aoiLogin(page){

  // ***** Sign in *****
  await page.focus('#username');
  await page.keyboard.type('dan');

  
  await page.click("#signInButton");
  // ***** end Sign in *****


  await page.waitForSelector('#wattRedirect');
  
  await page.screenshot(
    {
      path: 'screenshot.png',
      fullPage: true
    }
  );

};



// ###### MAIN #####
(async () => {
  
  //const report = await launchChromeAndRunLighthouse('https://watt.azets.com');
  const lhr = await launchChromeAndRunLighthouse(
    'http://www.yahoo.com', 
    9222,
    page => console.log('4. Call loginFunction(page)')
  );
  

  await fs.writeFile(
    './report.json', 
    JSON.stringify(lhr), 
    'utf8', 
    err => console.log(err) );

  //return JSON.stringify(report);  
  //console.log(report);

})();