# UI Lighthouse Report 

### This is a npm module for creating a Lighthouse reports for web applications based on Chrome Dev Tools Protocol.


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

node ./uiLhr.js url [uiActions.js]


#### Main steps

1. Open Chrome and navigate to the url (sets a debugging port for Chrome) . 

2. If an ui actions script is provided then perform actions described in it via Puppeteer. The main goal for the ui actions is to automate web apps authentication. This could change the final url for the lighthouse test.

3. Create a lighthouse report (.json) for the final url.

