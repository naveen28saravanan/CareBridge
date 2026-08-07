import GestureUtils from '../../utilities/gestureUtils.js';
import logger from '../../utilities/logger.js';

export class MobileBasePage {
  constructor(driver) {
    this.driver = driver;
    this.gestures = new GestureUtils(driver);
  }

  async findElement(selector, timeoutMs = 5000) {
    logger.info(`[Appium Mobile] Locating element: ${selector}`);
    if (this.driver.$) {
      const element = await this.driver.$(selector);
      await element.waitForDisplayed({ timeout: timeoutMs });
      return element;
    }
    return null;
  }

  async click(selector) {
    const el = await this.findElement(selector);
    if (el) await el.click();
  }

  async type(selector, text) {
    const el = await this.findElement(selector);
    if (el) {
      await el.clearValue();
      await el.setValue(text);
    }
  }

  async getText(selector) {
    const el = await this.findElement(selector);
    return el ? await el.getText() : '';
  }

  async isVisible(selector, timeoutMs = 3000) {
    try {
      const el = await this.findElement(selector, timeoutMs);
      return el ? await el.isDisplayed() : false;
    } catch {
      return false;
    }
  }
}

export default MobileBasePage;
