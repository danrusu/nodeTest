// Log message, await for asyncFunction and catch/log error.
//
// Returns asyncFunction result for success or false otherwise.
//
// Async calling context will not need to handle error.
//
async function asyncWrapper(message, asyncFunction){
    console.log(`----- ${message}`);
  
    return await asyncFunction()
    .catch(error => { 
      //console.log(`${message} - ${error.message}`); return 'failure';
      throw new Error(`${message} - error - ${error.message}`);
    });
}


// ##### MAIN
(async () => {
  
  const result1 = await asyncWrapper(

    'Test1(rejected)',

    () => new Promise(
      (resolve, reject) => reject(new Error('rejected'))
    ) 
  );

  // code rejects here if asyncWrapper throws on rejection
  console.log(`Test1 result: ${result1}`);
  

  
  const result2 = await asyncWrapper(

    'Test2(resolved)',

    () => new Promise(
      (resolve, reject) => resolve('success')
    ) 
  );
  console.log(`Test2 result: ${result2}`);


})()
.catch(error => console.log(`Caught MAIN error: ${error.message}`));