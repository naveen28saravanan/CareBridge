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
    return await this.isElementVisible('.shell', 5000) || await this.isElementVisible(this.welcomeHeader, 5000);
  }

  async navigateToTab(tabId) {
    logger.info(`Patient navigating to tab: ${tabId}`);
    const tabLocator = By.css(`button[data-nav-id="${tabId}"], .shell-nav button:nth-child(1)`);
    // Fallback XPath if custom data attribute is absent
    const xpathLocator = By.xpath(`//nav[contains(@class, 'shell-nav')]//button[contains(@class, 'nav-item') or contains(., '${tabId}')]`);
    
    if (await this.isElementVisible(xpathLocator)) {
      await this.utils.click(xpathLocator);
    } else {
      // Direct JS navigation simulation via custom event or button match
      await this.utils.executeScript(`
        const btn = Array.from(document.querySelectorAll('.shell-nav button')).find(b => b.textContent.toLowerCase().includes('${tabId.toLowerCase()}'));
        if (btn) btn.click();
      `);
    }
    await this.driver.sleep(500);
  }

  async bookAppointment(doctorName = 'Dr. Ananya Kumar', timeSlot = '10:30 AM') {
    await this.navigateToTab('consult');
    const doctorCardBtn = By.xpath(`//h3[contains(text(), '${doctorName}')]/ancestor::div[contains(@class, 'doctor-list-card')]//button[contains(text(), 'View slots')]`);
    if (await this.isElementVisible(doctorCardBtn)) {
      await this.utils.click(doctorCardBtn);
    } else {
      await this.utils.click(By.xpath("//button[contains(text(), 'View slots')]"));
    }
    await this.driver.sleep(500);

    const slotBtn = By.xpath(`//div[contains(@class, 'time-grid')]/button[contains(text(), '${timeSlot}')]`);
    if (await this.isElementVisible(slotBtn)) {
      await this.utils.click(slotBtn);
    }

    const confirmBtn = By.xpath("//button[contains(text(), 'Confirm demo appointment')]");
    await this.utils.click(confirmBtn);
    await this.driver.sleep(1000);
  }

  async runSymptomInsights() {
    await this.navigateToTab('symptoms');
    const chipBtn = By.css('.symptom-chip');
    if (await this.isElementVisible(chipBtn, 3000)) {
      await this.utils.click(chipBtn);
      await this.driver.sleep(300);
      const submitBtn = By.xpath("//button[contains(text(), 'Analyse symptoms') or contains(text(), 'Analyze')]");
      if (await this.isElementVisible(submitBtn, 3000)) {
        await this.utils.click(submitBtn);
        await this.driver.sleep(1000);
      }
    }
  }

  async signOut() {
    logger.info('Signing out patient');
    const signOutBtn = By.xpath("//button[contains(text(), 'Sign out') or contains(@aria-label, 'Sign out')]");
    if (await this.isElementVisible(signOutBtn)) {
      await this.utils.click(signOutBtn);
    } else {
      await this.utils.executeScript(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('sign out'));
        if (btn) btn.click();
      `);
    }
    await this.driver.sleep(1000);
  }
}

export default PatientWorkspacePage;
