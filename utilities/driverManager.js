import createDriver from '../config/selenium.config.js';
import logger from './logger.js';

class DriverManager {
  constructor() {
    this.driver = null;
  }

  async getDriver(browserName, isHeadless) {
    if (!this.driver) {
      logger.info(`Initializing WebDriver session (${browserName || 'default'}, headless=${isHeadless !== false})`);
      this.driver = await createDriver(browserName, isHeadless);
    }
    return this.driver;
  }

  async quitDriver() {
    if (this.driver) {
      logger.info('Closing WebDriver session');
      try {
        await this.driver.quit();
      } catch (err) {
        logger.error(`Error closing driver: ${err.message}`);
      } finally {
        this.driver = null;
      }
    }
  }
}

export const driverManager = new DriverManager();
export default driverManager;
