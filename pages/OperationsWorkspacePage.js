import BasePage from './BasePage.js';
import { By } from 'selenium-webdriver';
import logger from '../utilities/logger.js';

export class OperationsWorkspacePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.opsDashboard = By.css('.operations-dashboard-grid');
  }

  async isWorkspaceDisplayed() {
    return await this.isElementVisible(this.opsDashboard, 5000) || await this.isElementVisible('.shell', 5000);
  }

  async navigateToTab(tabId) {
    logger.info(`Operations navigating to tab: ${tabId}`);
    await this.utils.executeScript(`
      const btn = Array.from(document.querySelectorAll('.shell-nav button')).find(b => b.textContent.toLowerCase().includes('${tabId.toLowerCase()}'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(500);
  }

  async approveDoctorVerification(doctorName = 'Dr. Arjun Mehta') {
    await this.navigateToTab('doctors');
    const reviewBtn = By.xpath(`//strong[contains(text(), '${doctorName}')]/ancestor::div[contains(@class, 'data-table__row')]//button[contains(text(), 'Review')]`);
    if (await this.isElementVisible(reviewBtn)) {
      await this.utils.click(reviewBtn);
      await this.driver.sleep(500);
      const approveBtn = By.xpath("//button[contains(text(), 'Approve demo profile')]");
      await this.utils.click(approveBtn);
      await this.driver.sleep(1000);
    }
  }

  async updateHospitalAvailability(hospitalName, icuBeds = 12, ventilatorBeds = 6) {
    await this.navigateToTab('hospitals');
    const updateBtn = By.xpath(`//h3[contains(text(), '${hospitalName}')]/ancestor::div[contains(@class, 'availability-admin-card')]//button[contains(text(), 'Update')]`);
    if (await this.isElementVisible(updateBtn)) {
      await this.utils.click(updateBtn);
      await this.driver.sleep(500);
      
      const icuInput = By.xpath("//label[contains(., 'ICU beds')]/input");
      const ventInput = By.xpath("//label[contains(., 'Ventilator beds')]/input");
      const saveBtn = By.xpath("//button[contains(text(), 'Save verified demo status')]");

      await this.utils.type(icuInput, String(icuBeds));
      await this.utils.type(ventInput, String(ventilatorBeds));
      await this.utils.click(saveBtn);
      await this.driver.sleep(1000);
    }
  }

  async signOut() {
    logger.info('Signing out operations admin');
    await this.utils.executeScript(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('sign out'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(1000);
  }
}

export default OperationsWorkspacePage;
