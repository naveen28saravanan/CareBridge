import SeleniumUtils from '../utilities/seleniumUtils.js';
import config from '../config/env.config.js';
import logger from '../utilities/logger.js';
import { By } from 'selenium-webdriver';

export class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.utils = new SeleniumUtils(driver);
  }

  async clearSession() {
    try {
      await this.driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
    } catch {
      // ignore if page not loaded yet
    }
  }

  async open(pathUrl = '') {
    const targetUrl = config.baseUrl + pathUrl;
    logger.info(`Navigating to URL: ${targetUrl}`);
    await this.driver.get(targetUrl);
    await this.driver.sleep(800);
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async refreshPage() {
    logger.info('Refreshing page');
    await this.driver.navigate().refresh();
    await this.driver.sleep(1000);
  }

  async navigateBack() {
    logger.info('Navigating back in browser history');
    await this.driver.navigate().back();
    await this.driver.sleep(1000);
  }

  async navigateForward() {
    logger.info('Navigating forward in browser history');
    await this.driver.navigate().forward();
    await this.driver.sleep(1000);
  }

  async isElementVisible(selector, timeout = 3000) {
    return await this.utils.isDisplayed(selector, timeout);
  }

  async waitForLoaderToDisappear() {
    try {
      await this.driver.sleep(300);
    } catch {
      // ignore
    }
  }

  async switchLanguage(languageCode) {
    const selectLocator = 'label.auth-language select, select[aria-label="Language"]';
    if (await this.isElementVisible(selectLocator)) {
      await this.driver.executeScript(`
        const sel = document.querySelector('label.auth-language select, select[aria-label="Language"]');
        if (sel) {
          sel.value = '${languageCode}';
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `);
    }
  }

  async toggleTheme() {
    const toggleBtn = '.auth-theme, button[aria-label="Toggle appearance"]';
    if (await this.isElementVisible(toggleBtn)) {
      await this.utils.click(toggleBtn);
    }
  }
}

export default BasePage;
