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
    await this.driver.executeScript(`
      const btn = Array.from(document.querySelectorAll('.auth-tabs button')).find(b => b.textContent.includes('${tabText}'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(400);
  }

  async selectRole(roleName = 'patient') {
    const roleCapitalized = roleName.charAt(0).toUpperCase() + roleName.slice(1);
    await this.driver.executeScript(`
      const btn = Array.from(document.querySelectorAll('.auth-role-grid button')).find(b => b.textContent.toLowerCase().includes('${roleName.toLowerCase()}'));
      if (btn) btn.click();
    `);
    await this.driver.sleep(300);
  }

  async login(email, password, role = 'patient') {
    logger.info(`Performing login for role=${role}, email=${email}`);
    await this.selectMode('signin');
    await this.selectRole(role);
    await this.utils.waitForElement(this.emailInput, 5000);

    await this.driver.executeScript(`
      const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        if (el) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('#email', '${email || ''}');
      setVal('#password', '${password || ''}');
      const form = document.querySelector('form.auth-form');
      if (form) form.requestSubmit();
    `);
    
    await this.driver.sleep(1500);
  }

  async register(name, email, password, confirmPassword) {
    logger.info(`Performing registration for name=${name}, email=${email}`);
    await this.selectMode('signup');
    await this.utils.waitForElement(this.nameInput, 5000);

    await this.driver.executeScript(`
      const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        if (el) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      setVal('#signup-name', '${name || ''}');
      setVal('#email', '${email || ''}');
      setVal('#password', '${password || ''}');
      setVal('#confirm-password', '${confirmPassword || ''}');
      const form = document.querySelector('form.auth-form');
      if (form) form.requestSubmit();
    `);

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
