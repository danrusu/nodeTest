const drUrl = 'http://danrusu.ro/uiTest';
const drTesterHomePageUrl = drUrl + '/testerHome.html';

const path = require('path');

const { waitForPageAction } = require(
  path.resolve(__dirname, 'waitForPageAction.js'));



const login = async (browser, page) => {
  const pageLoadTimeout = 10000; // msec


  // ***** Sign in *****
  console.log(' drLogin started');


  // type username
  const usernameInputSelector = '#username';
  await waitForPageAction(page,
    async (page) => page.waitForSelector(usernameInputSelector)
  );

  await page.type(usernameInputSelector, 'tester')
    .catch(err => { throw new Error(`${err.message} - in type ${usernameInputSelector}`) });


  // type password
  const passwordInputSelector = '#password';
  await waitForPageAction(page,
    async (page) => page.waitForSelector(passwordInputSelector)
  );

  await page.type(passwordInputSelector, 'testpass')
    .catch(err => { throw new Error(`${err.message} - in type ${passwordInputSelector}`) });


  // click login button
  const loginBtnSelector = '#login';
  await waitForPageAction(page,
    async (page) => page.waitForSelector(loginBtnSelector)
  );

  await page.click(loginBtnSelector)
    .catch(err => { throw new Error(`${err.message} - in click ${loginBtnSelector}`) });



  // Wait for PMT home page url
  const allPages = await browser.pages();

  console.log(' wait for the final url (timeout = 60 sec, step = 1 sec)');
  let drTesterHomePage;
  for (let i = 0; i < 60; i++) {
    const allPages = await browser.pages();
    drTesterHomePage = allPages[0];
    if (drTesterHomePage.url() === drTesterHomePageUrl) {
      console.log(` Navigated to url(${drTesterHomePageUrl}) after ${i} seconds.`)
      break;
    }
    await drTesterHomePage.waitFor(1000);
  }

  if (!drTesterHomePage) throw Error(' Error: Tester home page was not opened!');


  console.log(` drTesterHomePage: ${drTesterHomePage.url()}`);


  return drTesterHomePage;
};



exports.uiActions = login;
