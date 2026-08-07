import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';
import edge from 'selenium-webdriver/edge.js';
import config from './env.config.js';

export async function createDriver(browserName = config.browser, isHeadless = config.headless) {
  let builder = new Builder();

  switch (browserName.toLowerCase()) {
    case 'firefox': {
      const options = new firefox.Options();
      if (isHeadless) {
        options.addArguments('-headless');
      }
      options.addArguments('--width=1280');
      options.addArguments('--height=800');
      builder = builder.forBrowser('firefox').setFirefoxOptions(options);
      break;
    }
    case 'edge': {
      const options = new edge.Options();
      if (isHeadless) {
        options.addArguments('--headless=new');
      }
      options.addArguments('--window-size=1280,800');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      builder = builder.forBrowser('MicrosoftEdge').setEdgeOptions(options);
      break;
    }
    case 'chrome':
    default: {
      const options = new chrome.Options();
      if (isHeadless) {
        options.addArguments('--headless=new');
      }
      options.addArguments('--window-size=1280,800');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--disable-search-engine-choice-screen');
      builder = builder.forBrowser('chrome').setChromeOptions(options);
      break;
    }
  }

  const driver = await builder.build();
  await driver.manage().setTimeouts({ implicit: config.implicitWaitMs, pageLoad: config.pageLoadTimeoutMs });
  return driver;
}

export default createDriver;
