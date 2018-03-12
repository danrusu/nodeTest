// ##### Dependencies
const chromeLauncher = require('chrome-launcher');

const puppeteer = require('puppeteer');

const lighthouse = require('lighthouse');


const request = require('request-promise');

const fs = require('fs');



async function launchChrome(url, debuggingPort, config={}){
  console.log(` url: ${url}`);
  console.log(` debuggingPort: ${debuggingPort}`);
  
  return await chromeLauncher.launch( 
    { 
      // default
      // headless: false

      startingUrl: url,

      // Chrome debugging port 
      // Equivalent to "chrome.exe --remote-debugging-port=9222"
      port: debuggingPort,

      enableExtensions: true,
      
      // default: Chronium - always updated by npm and compatible with Dev Tools Protocol
      // chromePath: 'C:\\node\\nodeTest\\node_modules\\puppeteer\\.local-chromium\\win64-536395\\chrome-win32\\chrome.exe'
      
      // add/overwrite configuration settings
      ...config
    }     
  );
};



async function getWebSocketDebuggerUrl(debuggingPort){

  const webSocketInfo = await request(
    `http://localhost:${debuggingPort}/json/version`, 
    response => response
  );

  //console.log('Response ', JSON.parse(webSocketInfo));
  const { webSocketDebuggerUrl } = JSON.parse(webSocketInfo);

  return webSocketDebuggerUrl;
};



async function lhrReport(
  startingUrl, 

  debuggingPort, 

  chromePath,
  
  uiActions = (browser, page) => {
    console.log(' uiActions not specified');
    return page;
  }

){

  // 1. Launch Chrome
  console.log(`1. Start browser`);
  const chrome = await launchChrome(
    startingUrl, 
    debuggingPort,
    {
      chromePath: chromePath
    }
  );
  

  // 2. Get WebSocket Url for puppeteer browser from
  // http://localhost:9222/json/version    
  const webSocketDebuggerUrl = await getWebSocketDebuggerUrl(chrome.port);
  console.log(`2. Get webSocketDebuggerUrl: ${webSocketDebuggerUrl}`);

  
  // 3. Launch puppeteer for existing browser (web socket endpoint)
  const browser = await puppeteer.connect(
    {
      browserWSEndpoint: webSocketDebuggerUrl,
    }
  );
  console.log('3. Connected puppeteer to webSocketDebuggerUrl');


  const page = (await browser.pages())[0];
  const urlTimeout = 10000;
  await Promise.race(
    [
      page.waitForNavigation({ urlTimeout, waitUntil: 'load' }),
      page.waitForNavigation({ urlTimeout, waitUntil: 'domcontentloaded' }),
      page.waitForNavigation({ urlTimeout, waitUntil: 'networkidle0' })
    ]

  ).catch(error => console.log(
    `waitForNavigation race[load, domcontentloaded, networkidle0] caught: ${error.message}`
  ));  
  


  // 4. Execute UI actions in browser via puppeteer
  console.log('4. Call uiActions on current page');

  const currentPage = await uiActions(browser, page); 

  
  // 5. Run lighthouse audit on browser debugging port
  console.log(`5. Run lighthouse audit for ${currentPage.url()}:${chrome.port}`);
  console.log(' ...');

  const lhr = await lighthouse(
    currentPage.url(), 
    { 
      port: chrome.port,
      output: 'json' 
    },
    null
  );
    
  console.log(` score: ${lhr.score}`);
  
  // The gathered artifacts are typically removed as they can be quite large (~50MB+)
  delete lhr.artifacts;

  await browser.disconnect();
  
  await chrome.kill();

  console.log(' report: report.json');

  return lhr;
};



// ##### MAIN #####
(async () => {

  const url = process.argv[2];
  const uiActionsScript = process.argv[3];
  
  let uiActions;
  if (uiActionsScript){
    uiActions = require(uiActionsScript).uiActions;
  }

  const lhrReportPath = './report.json';

  //TODO - read lhrReport params to JSON file
  const lhr = await lhrReport(

    url, 

    9222,

    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',

    uiActions
  );
  

  await fs.writeFile(
    lhrReportPath, 
    JSON.stringify(lhr), 
    'utf8', 
    err => console.log(err) 
  );

  //return JSON.stringify(lhr);  
  //console.log(lhr);

})();