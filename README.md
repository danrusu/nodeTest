# UI Lighthouse Report 

### Npm project for creating Lighthouse reports for web applications.

### Based on Chrome Dev Tools Protocol.

#### Description

    1. Opens Chrome and navigate to config.url (sets a debugging port for Chrome - config.debuggingPort). 

    2. If config.uiActionsScript is set then perform actions described in it via Puppeteer. 
    
    The main goal for the ui actions is to automate web apps authentication. 

    This could change the final url for the lighthouse test.

    3. Create lighthouse reports (json/html) for the final url.

#### Usage

    git clone https://github.com/danrusu/ui_lhr.git

    cd ui_lhr

    npm install

    node uiLhr.js config_template.json

#### Run configuration template - config_template.json

    {
      "chromePath": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

      "debuggingPort": "9222",

      "url": "http://danrusu.ro/uiTest/uiTest.html",

      "uiActionsScript": "danrusu_authenticatePOM.js",

      "lhrPath": "lhr.json",

      "lhrHtmlPath": "lhr.html"
    }

    Note: uiActionsScript, lhrPath, lhrHtmlPath are relative paths.

#### Helper utility - lhrJsonToHtml.js

    Mnually navigate to a website, open Chrome Dev Tools, run audit (lat tab top right) and then download the report (lhr.json).

    You can generate the html report by using:

    node lhrJsonToHtml.js lhr.json lhr.html


#### Environment

    npm 5.6.0

    node v8.9.4
