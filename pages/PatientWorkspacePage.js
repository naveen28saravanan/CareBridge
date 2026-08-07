import BasePage from './BasePage.js';
import { By } from 'selenium-webdriver';
import logger from '../utilities/logger.js';

export class PatientWorkspacePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.welcomeHeader = By.css('.patient-welcome');
    this.signOutButton = By.xpath("//button[contains(text(), 'Sign out') or contains(text(), 'Logout')]");
  }

  async isWorkspaceDisplayed() {
    return await this.isElementVisible('.app-shell', 5000) || await this.isElementVisible(this.welcomeHeader, 5000);
  }

  async navigateToTab(tabId) {
    logger.info(`Patient navigating to tab: ${tabId}`);
    await this.utils.executeScript(`
      const search = '${tabId.toLowerCase()}';
      const keyMap = {
        symptoms: 'symptom',
        emergency: 'emergenc',
        hospitals: 'hospital'
      };
      const term = keyMap[search] || search;
      const btn = Array.from(document.querySelectorAll('.main-nav button, .mobile-nav button')).find(b => b.textContent.toLowerCase().includes(term));
      if (btn) btn.click();
    `);
    await this.driver.sleep(500);
  }

  async bookAppointment(doctorName = 'Dr. Ananya Kumar', timeSlot = '10:30 AM') {
    await this.navigateToTab('consult');
    const doctorCardBtn = By.xpath(`//h3[contains(., '${doctorName}')]/ancestor::div[contains(@class, 'doctor-list-card')]//button[contains(., 'View slots')]`);
    if (await this.isElementVisible(doctorCardBtn, 3000)) {
      await this.utils.click(doctorCardBtn);
    } else {
      await this.utils.executeScript(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View slots'));
        if (btn) btn.click();
      `);
    }
    await this.driver.sleep(500);

    const slotBtn = By.xpath(`//div[contains(@class, 'time-grid')]/button[contains(., '${timeSlot}')]`);
    if (await this.isElementVisible(slotBtn, 3000)) {
      await this.utils.click(slotBtn);
    } else {
      await this.utils.executeScript(`
        const btn = Array.from(document.querySelectorAll('.time-grid button')).find(b => b.textContent.includes('${timeSlot}'));
        if (btn) btn.click();
      `);
    }

    const confirmBtn = By.xpath("//button[contains(., 'Confirm demo appointment')]");
    if (await this.isElementVisible(confirmBtn, 3000)) {
      await this.utils.click(confirmBtn);
    } else {
      await this.utils.executeScript(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm'));
        if (btn) btn.click();
      `);
    }
    await this.driver.sleep(1000);
  }

  async runSymptomInsights() {
    await this.navigateToTab('symptoms');
    const chipBtn = By.css('.symptom-chip');
    if (await this.isElementVisible(chipBtn, 3000)) {
      await this.utils.click(chipBtn);
      await this.driver.sleep(300);
      const submitBtn = By.xpath("//button[contains(., 'Analyse symptoms') or contains(., 'Analyze')]");
      if (await this.isElementVisible(submitBtn, 3000)) {
        await this.utils.click(submitBtn);
      } else {
        await this.utils.executeScript(`
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('analy'));
          if (btn) btn.click();
        `);
      }
      await this.driver.sleep(1000);
    }
  }

  async signOut() {
    logger.info('Signing out patient');
    await this.utils.executeScript(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('sign out'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(1000);
  }
}

export default PatientWorkspacePage;
