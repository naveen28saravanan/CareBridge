import BasePage from './BasePage.js';
import { By } from 'selenium-webdriver';
import logger from '../utilities/logger.js';

export class DoctorWorkspacePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.doctorHero = By.css('.doctor-hero');
  }

  async isWorkspaceDisplayed() {
    return await this.isElementVisible('.app-shell', 5000) || await this.isElementVisible(this.doctorHero, 5000);
  }

  async navigateToTab(tabId) {
    logger.info(`Doctor navigating to tab: ${tabId}`);
    await this.utils.executeScript(`
      const btn = Array.from(document.querySelectorAll('.main-nav button, .mobile-nav button')).find(b => b.textContent.toLowerCase().includes('${tabId.toLowerCase()}'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(500);
  }

  async saveClinicalNote(symptoms, assessment, instructions) {
    await this.navigateToTab('notes');
    
    const symptomsBox = By.xpath("//label[contains(., 'Symptoms')]/textarea");
    const assessmentBox = By.xpath("//label[contains(., 'assessment')]/textarea");
    const instructionsBox = By.xpath("//label[contains(., 'instructions')]/textarea");
    const saveBtn = By.xpath("//button[contains(., 'Save draft')]");

    if (symptoms) await this.utils.type(symptomsBox, symptoms);
    if (assessment) await this.utils.type(assessmentBox, assessment);
    if (instructions) await this.utils.type(instructionsBox, instructions);

    if (await this.isElementVisible(saveBtn, 5000)) {
      await this.utils.click(saveBtn);
    } else {
      await this.utils.executeScript(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save draft'));
        if (btn) btn.click();
      `);
    }
    await this.driver.sleep(1000);
  }

  async createPrescription(medicine, strength, instructions) {
    await this.navigateToTab('prescriptions');
    
    const medicineInput = By.xpath("//label[contains(., 'Medicine name')]/input");
    const strengthInput = By.xpath("//label[contains(., 'Strength')]/input");
    const instructionsInput = By.xpath("//label[contains(., 'Instructions')]/textarea");
    const addBtn = By.xpath("//button[contains(., 'Add item')]");

    await this.utils.type(medicineInput, medicine);
    await this.utils.type(strengthInput, strength);
    await this.utils.type(instructionsInput, instructions);
    await this.utils.click(addBtn);

    const checkbox = By.css('input[type="checkbox"]');
    if (await this.isElementVisible(checkbox)) {
      await this.utils.click(checkbox);
    }

    const signBtn = By.xpath("//button[contains(., 'Sign and share')]");
    if (await this.isElementVisible(signBtn)) {
      await this.utils.click(signBtn);
      await this.driver.sleep(1000);
    }
  }

  async signOut() {
    logger.info('Signing out doctor');
    await this.utils.executeScript(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('sign out'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(1000);
  }
}

export default DoctorWorkspacePage;
