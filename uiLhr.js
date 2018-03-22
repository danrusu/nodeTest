// ##### Dependencies
const chromeLauncher = require('chrome-launcher');

const puppeteer = require('puppeteer');

const lighthouse = require('lighthouse');

const ReportGenerator = require('lighthouse/lighthouse-core/report/v2/report-generator');


const request = require('request-promise');

const fs = require('fs');

const { promisify } = require('util');

const [readFileAsync, writeFileAsync] = [fs.readFile, fs.writeFile].map(promisify);


const path = require('path');

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



async function lhrReport(
  startingUrl,

  debuggingPort,

  chromePath,

  uiActions = (browser, page) => {
    console.log(' uiActions not specified');
    return page;
  }

) {

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

  // wait for page to have an url
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

  // The gathered artifacts are typically removed as they can be quite large (~50MB+)
  delete lhr.artifacts;

  await browser.disconnect();

  await chrome.kill();

  return lhr;
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
  const lhr = await lhrReport(

    config.url,

    config.debuggingPort,

    config.chromePath,

    uiActions
  );


  console.log(` score: ${lhr.score}`);


  // REPORTS
  if (config.lhrPath) {
    // save JSON report
    await writeFileAsync(
      pathResolver(config.lhrPath),
      JSON.stringify(lhr),
      'utf8'
    );
    console.log(`JSON report: ${pathResolver(config.lhrPath)}`);
  }


  if (config.lhrHtmlPath) {
    // save HTML report
    const lhrHtml = new ReportGenerator().generateReportHtml(lhr);
    await writeFileAsync(
      pathResolver(config.lhrHtmlPath),
      lhrHtml,
      'utf8'
    );
    console.log(`HTML report: ${pathResolver(config.lhrHtmlPath)}`);
  }

})()
  .catch(err => console.log(err.message));