const fs = require('fs');

const { promisify } = require('util');

const [ readFileAsync, writeFileAsync ] = [ fs.readFile, fs.writeFile ].map(promisify);

const ReportGenerator = require('lighthouse/lighthouse-core/report/v2/report-generator');


const path = require('path');

const pathResolver = (relPath) => {
  return path.resolve(__dirname, relPath);
};



async function lhrJsonToHtml(lhrFile, lhrHtmlFile) {

  const lhrString = await readFileAsync(lhrFile);

  const lhr = JSON.parse(lhrString);


  // save HTML report
  const lhrHtml = new ReportGenerator().generateReportHtml(lhr);
  await writeFileAsync(
    pathResolver(lhrHtmlFile), 
    lhrHtml, 
    'utf8' 
  );
  console.log(`HTML report: ${pathResolver(lhrHtmlFile)}`);

}



// ***** MAIN
(async () => { 
  await lhrJsonToHtml( 
    ...[ process.argv[2], process.argv[3] ].map(pathResolver)
  )
  .catch(err => console.log(err.message));
})();