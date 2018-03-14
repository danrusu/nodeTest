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

(async () => { 
  await lhrJsonToHtml(
    pathResolver(process.argv[2]), 
    pathResolver(process.argv[3])
  )
  .catch(err => console.log(err.message));
})();