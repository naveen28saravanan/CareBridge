import { By, until } from 'selenium-webdriver';
import logger from './logger.js';

export class SeleniumUtils {
  constructor(driver) {
    this.driver = driver;
  }

  async waitForElement(locator, timeout = 10000) {
    try {
      const by = typeof locator === 'string' ? By.css(locator) : locator;
      const element = await this.driver.wait(until.elementLocated(by), timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      return element;
    } catch (error) {
      logger.error(`Element not visible/located: ${locator} - ${error.message}`);
      throw error;
    }
  }

  async click(locator, timeout = 10000) {
    const element = await this.waitForElement(locator, timeout);
    await this.scrollIntoView(element);
    try {
      await element.click();
    } catch (err) {
      // Fallback to JS click if blocked by overlapping modal or layout transition
      logger.warn(`Native click failed on ${locator}, performing JS click fallback.`);
      await this.executeScript('arguments[0].click();', element);
    }
  }

  async type(locator, text, clearFirst = true) {
    const element = await this.waitForElement(locator);
    await this.scrollIntoView(element);
    if (clearFirst) {
      await element.clear();
    }
    await element.sendKeys(text);
  }

  async getText(locator) {
    const element = await this.waitForElement(locator);
    return (await element.getText()).trim();
  }

  async isDisplayed(locator, timeout = 5000) {
    try {
      const by = typeof locator === 'string' ? By.css(locator) : locator;
      const element = await this.driver.wait(until.elementLocated(by), timeout);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async scrollIntoView(elementOrLocator) {
    let element = elementOrLocator;
    if (typeof elementOrLocator === 'string' || elementOrLocator.by) {
      const by = typeof elementOrLocator === 'string' ? By.css(elementOrLocator) : elementOrLocator;
      element = await this.driver.findElement(by);
    }
    await this.driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
    await this.driver.sleep(200);
  }

  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  async handleAlert(accept = true) {
    try {
      await this.driver.wait(until.alertIsPresent(), 5000);
      const alert = await this.driver.switchTo().alert();
      const text = await alert.getText();
      if (accept) {
        await alert.accept();
      } else {
        await alert.dismiss();
      }
      return text;
    } catch (error) {
      logger.warn(`No alert present to handle: ${error.message}`);
      return null;
    }
  }

  async retryOperation(operationFn, retries = 3, delayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operationFn();
      } catch (err) {
        lastError = err;
        logger.warn(`Operation failed (attempt ${attempt}/${retries}): ${err.message}`);
        if (attempt < retries) {
          await this.driver.sleep(delayMs);
        }
      }
    }
    throw lastError;
  }
}

export default SeleniumUtils;
