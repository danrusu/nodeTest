const puppeteer = require('puppeteer');


function asyncAction(message, asyncFunction, ...args){
  console.log(message);

  return await asyncFunction(...args)
    .catch(error => { throw Error(`${message} - error: ${error.message}`); });
}


(async () => {
  

  const browser = await puppeteer.launch(
    { 

      // default: true  
      headless: false, 

      // default: Chronium 
      // 'C:\\node\\nodeTest\\node_modules\\puppeteer\\.local-chromium\\win64-536395\\chrome-win32\\chrome.exe'
      executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

    } 
  )
    .catch(error => console.log('puppeteer.launch caught', error.message));

  const page = await browser.newPage()
    .catch(error => console.log('browser.newPage caught', error.message));
  
  // await page.setViewport(
  //   {
  //     width: 2560,
  //     height: 1440    
  //   }
  // );

  await page.goto('https://myvisma-app-idp-develop-devdb.staging.azets.com/user/login/')
    .catch(error => console.log('page.goto caught', error.message));


  await aoiLogin(browser, page)
    .catch(error => console.log('caught', error.message));

  //await browser.close();
  throw Error('Error: MAIN error');
})()
.catch(error => console.log('caught', error.message));



async function aoiLogin(browser, page){

  // ***** Sign in *****
  //console.log('waitForNavigation: networkidle0');
  
  //await page.waitForNavigation({waitUntil : 'networkidle0'});

  await page.type('#identity', 'vsn_tester');

  await page.click('button[type="submit"]');

  await page.waitFor(3000);

  await page.type('#credential', 'Test12345!');

  await page.waitFor(3000);
  
  await page.click('#signinButton');

  await page.waitFor(10000);

  await page.click('a[data-identifier="EFLOW_ENTERPRISE"]');

  // wait to have 3 opened pages (timeout = 60 sec, step = 1 sec)
  for (let i=0; i<60; i++){
    await page.waitFor(1000);
    const allPages = await browser.pages();
    if (allPages.length === 3) break;
  }

  const allPages = await browser.pages();
  allPages.forEach( 
    (page, index) =>  console.log(`tab ${index}: ${page.url()}`),
  );

  //
  const aoiPage = allPages.reduce( 
    (acc, page) => {
      if (page.url() === 'http://10.56.1.33/eFlowEnterprise/en'){
        acc = page;
      }
      return acc;
    }, undefined
  );

  if (! aoiPage) throw Error('Error: AOI page was not opened!');


  console.log(`aoiPage: ${aoiPage.url()}`);

  const timeout = 10000; // msec
  await Promise.race(
    [
      aoiPage.waitForNavigation({ timeout, waitUntil: 'load' }),
      aoiPage.waitForNavigation({ timeout, waitUntil: 'domcontentloaded' }),
      aoiPage.waitForNavigation({ timeout, waitUntil: 'networkidle0' })
    ]

  ).catch(error => console.log(
    `waitForNavigation race[load, domcontentloaded, networkidle0] caught: ${error.message}`
  ));


  await aoiPage.waitForSelector('#btnActivity_ap', {visible: true})
    .catch(error => console.log('caught', error.message));  
  
  console.log('finished');
 
};