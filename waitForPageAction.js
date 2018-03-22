// Wait for selector uses eval which cannot be used 
// for security reasons in some web apps.
// This is a wrapper that tries to focus on an element
// with a selector - for a specified timeout (defaults to 10sec).
const waitForPageAction = async (page, pageAction, timeout = 10000) => {
  console.log(` Wait ${timeout} ms for ${pageAction} to succeed.`);
  let success = true;
  for (let i = 0; i <= timeout / 1000; i++) {

    await pageAction(page)
      .catch(err => {
        success = false;
        console.log(` Action failed after: ${i} seconds; err: ${err.message}`)
      });

    await page.waitFor(1000);

    if (success) {
      console.log(` Action succeeded after ${i} seconds!`);
      break;
    }
  }

  return success;
};


const asyncAction = (message, asyncFunction, ...args) => {
  console.log(message);
  return await asyncFunction(...args)
    .catch(error => { throw Error(`${message} - error: ${error.message}`); });
}

exports.waitForPageAction = waitForPageAction;
exports.asyncAction = asyncAction;