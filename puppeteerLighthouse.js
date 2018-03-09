// ##### Dependencies
const chromeLauncher = require('chrome-launcher');

const puppeteer = require('puppeteer');

const lighthouse = require('lighthouse');


const request = require('request-promise');

const fs = require('fs');



async function launchChrome(url, debuggingPort, config={}){

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
  loginFunction = ()=>console.log('blank loginFunction')){

  // 1. Launch Chrome
  const chrome = await launchChrome(
    startingUrl, 
    debuggingPort,
    {
      chromePath: chromePath
    }
  );
  console.log(`1. Started browser with debugging port: ${chrome.port}`);
  

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


  // 4. Execute UI actions in browser via puppeteer
  const page = (await browser.pages())[0];
  
  console.log('4. Call loginFunction(page)');
  await loginFunction(page);   

  
  // 5. Run lighthouse audit on browser debugging port
  console.log(`5. Run lighthouse audit on ${startingUrl} ...`);
  const lhr = await lighthouse(
    startingUrl, 
    { 
      port: chrome.port,
      output: 'json' 
    },
    null
  );
    
  console.log(`Lighthouse score: ${lhr.score}`);
  
  // The gathered artifacts are typically removed as they can be quite large (~50MB+)
  delete lhr.artifacts;

  await browser.disconnect();
  
  await chrome.kill();

  console.log('Report created: report.json');

  return lhr;
};



// ##### MAIN #####
(async () => {
  
  //const report = await lhrReport('https://watt.azets.com');
  const lhr = await lhrReport(

    'http://www.yahoo.com', 
    
    9222,
    
    {
      chromePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    }
  );
  

  await fs.writeFile(
    './report.json', 
    JSON.stringify(lhr), 
    'utf8', 
    err => console.log(err) 
  );

  //return JSON.stringify(report);  
  //console.log(report);

})();