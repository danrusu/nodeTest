'use strict';

// ##### Dependencies
const chromeLauncher = require('chrome-launcher'),
  puppeteer = require('puppeteer'),


  request = require('request-promise'),
  fs = require('fs'),
  { promisify } = require('util'),

  [readFileAsync, writeFileAsync] = [fs.readFile, fs.writeFile].map(promisify),

  path = require('path');




const pathResolver = (relPath) => {
  return path.resolve(__dirname, relPath);
};



async function launchChrome(url, debuggingPort, config = {}) {
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



async function getWebSocketDebuggerUrl(debuggingPort) {

  const webSocketInfo = await request(
    `http://localhost:${debuggingPort}/json/version`,
    response => response
  );

  //console.log('Response ', JSON.parse(webSocketInfo));
  const { webSocketDebuggerUrl } = JSON.parse(webSocketInfo);

  return webSocketDebuggerUrl;
};



async function getPageCookies(
  startingUrl,

  debuggingPort,

  chromePath,

  uiActions = (browser, page) => {
    logger.log(' uiActions not specified');
    return page;
  },

  logger

) {

  // 1. Launch Chrome
  logger.log(`1. Start browser`);
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
  logger.log(`2. Get webSocketDebuggerUrl: ${webSocketDebuggerUrl}`);


  // 3. Launch puppeteer for existing browser (web socket endpoint)
  const browser = await puppeteer.connect(
    {
      browserWSEndpoint: webSocketDebuggerUrl,
    }
  );
  logger.log('3. Connected puppeteer to webSocketDebuggerUrl');

  // wait for page to have an url
  const page = (await browser.pages())[0];
  const urlTimeout = 10000;

  await Promise.race(
    [
      page.waitForNavigation({ urlTimeout, waitUntil: 'load' }),
      page.waitForNavigation({ urlTimeout, waitUntil: 'domcontentloaded' }),
      page.waitForNavigation({ urlTimeout, waitUntil: 'networkidle0' })
    ]

  ).catch(error => logger.log(
    `waitForNavigation race[load, domcontentloaded, networkidle0] caught: ${error.message}`
  ));



  // 4. Execute UI actions in browser via puppeteer
  logger.log('4. Call uiActions on current page');

  const currentPage = await uiActions(browser, page);

  const cookies = await currentPage.cookies();


  //await browser.disconnect();

  await chrome.kill();

  return cookies;
};



async function usage(args) {

  const configTemplate = await readFileAsync('.\\config_template.json', 'utf8');

  // get run configuration from first parameter
  const usageError = '\nConfig file not specified!'
    + '\n\nUsage: node uiLhr.js config.json'
    + '\n\ne.g. config.json:\n'
    + configTemplate;

  const configPath = args[2];
  if (!configPath) {

    throw new Error(usageError);
  }

  return configPath;
}



// ##### MAIN #####
(async () => {

  const configPath = await usage(process.argv);
  const config = JSON.parse(
    await readFileAsync(
      configPath,
      'utf8'
    )
  );


  let uiActions;
  if (config.uiActionsScript) {
    uiActions = require(pathResolver(config.uiActionsScript)).uiActions;
  }

  //TODO - read lhrReport params to JSON file
  const finalPageCookies = await getPageCookies(

    config.url,

    config.debuggingPort,

    config.chromePath,

    uiActions,

    //console
    { log: () => { } }
  );


  console.log(`***Cookies: ${JSON.stringify(finalPageCookies, null, 2)}`);

  await writeFileAsync(
    pathResolver(config.cookiesPath ? config.cookiesPath : "cookies.json"),
    JSON.stringify(finalPageCookies, null, 2),
    'utf8'
  );

})()
  .catch(err => console.log(err.message));