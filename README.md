# UI Lighthouse Report 

### Npm module for creating Lighthouse reports for web applications.

### Based on Chrome Dev Tools Protocol.


#### Dependencies

    "puppeteer": "^1.1.1"
    
    "puppeteer-lighthouse": "^0.1.1"
    
    "request": "^2.83.0"
    
    "request-promise": "^4.2.2"
    
    "socketio": "^1.0.0"


#### Usage

    git clone https://github.com/danrusu/ui_lhr.git

    cd ui_lhr

    npm install

    node uiLhr.js config_template.json

#### Demo run configuration - config_template.json

    {
      "chromePath": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

      "debuggingPort": "9222",

      "url": "http://danrusu.ro/uiTest/uiTest.html",

      "uiActionsScript": "danrusu_authenticatePOM.js",

      "lhrPath": "lhr.json",

      "lhrHtmlPath": "lhr.html"
    }

    Note: uiActionsScript, lhrPath, lhrHtmlPath are relative paths.


#### Main steps

1. Opens Chrome and navigate to config.url (sets a debugging port for Chrome - config.debuggingPort). 

2. If config.uiActionsScript is set then perform actions described in it via Puppeteer. 
The main goal for the ui actions is to automate web apps authentication. 
This could change the final url for the lighthouse test.

3. Create lighthouse reports (json/html) for the final url.

