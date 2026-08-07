import BasePage from './BasePage.js';
import { By } from 'selenium-webdriver';
import logger from '../utilities/logger.js';

export class AuthPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('#email');
    this.passwordInput = By.css('#password');
    this.confirmPasswordInput = By.css('#confirm-password');
    this.nameInput = By.css('#signup-name');
    this.submitButton = By.css('#login-button');
    this.errorMessage = By.css('.auth-error');
    this.authTabs = By.css('.auth-tabs');
    this.roleGrid = By.css('.auth-role-grid');
    this.forgotPasswordButton = By.xpath("//button[contains(text(), 'Forgot password?')]");
    this.resetModal = By.css('.provider-dialog');
  }

  async selectMode(mode = 'signin') {
    const tabText = mode === 'signin' ? 'Sign in' : 'Create account';
    const tabLocator = By.xpath(`//div[contains(@class, 'auth-tabs')]/button[contains(text(), '${tabText}')]`);
    await this.utils.click(tabLocator);
    await this.driver.sleep(300);
  }

  async selectRole(roleName = 'patient') {
    const roleCapitalized = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    const roleBtn = By.xpath(`//div[contains(@class, 'auth-role-grid')]//strong[contains(text(), '${roleCapitalized}')]/..`);
    if (await this.isElementVisible(roleBtn)) {
      await this.utils.click(roleBtn);
      await this.driver.sleep(300);
    }
  }

  async login(email, password, role = 'patient') {
    logger.info(`Performing login for role=${role}, email=${email}`);
    await this.selectMode('signin');
    await this.selectRole(role);

    // Clear inputs via JS to guarantee empty state when needed
    await this.utils.executeScript(`
      const e = document.querySelector('#email');
      const p = document.querySelector('#password');
      if (e) { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); }
      if (p) { p.value = ''; p.dispatchEvent(new Event('input', { bubbles: true })); }
    `);

    if (email) {
      await this.utils.type(this.emailInput, email);
    }
    if (password) {
      await this.utils.type(this.passwordInput, password);
    }

    await this.utils.click(this.submitButton);
    await this.driver.sleep(1200);
  }

  async register(name, email, password, confirmPassword) {
    logger.info(`Performing registration for name=${name}, email=${email}`);
    await this.selectMode('signup');
    await this.utils.waitForElement(this.nameInput, 5000);
    
    if (name) await this.utils.type(this.nameInput, name);
    if (email) await this.utils.type(this.emailInput, email);
    if (password) await this.utils.type(this.passwordInput, password);
    if (confirmPassword) await this.utils.type(this.confirmPasswordInput, confirmPassword);
    
    await this.utils.click(this.submitButton);
    await this.driver.sleep(1200);
  }

  async getErrorMessage() {
    if (await this.isElementVisible(this.errorMessage, 3000)) {
      return await this.utils.getText(this.errorMessage);
    }
    return '';
  }

  async openForgotPasswordModal() {
    await this.selectMode('signin');
    await this.utils.click(this.forgotPasswordButton);
    await this.utils.waitForElement(this.resetModal);
  }

  async resetPassword(email, newPassword) {
    await this.openForgotPasswordModal();
    const emailField = By.css('.provider-dialog input[type="email"]');
    const passwordField = By.css('.provider-dialog input[type="password"]');
    const submitBtn = By.css('.provider-dialog button.auth-submit');
    
    await this.utils.type(emailField, email);
    await this.utils.type(passwordField, newPassword);
    await this.utils.click(submitBtn);
    await this.driver.sleep(1000);
  }

  async isAuthScreenDisplayed() {
    return await this.isElementVisible('.auth-shell', 3000);
  }
}

export default AuthPage;
