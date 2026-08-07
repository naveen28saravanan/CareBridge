import MobileBasePage from './MobileBasePage.js';
import appiumConfig from '../../config/appium.config.js';

export class MobileAuthPage extends MobileBasePage {
  constructor(driver) {
    super(driver);
    this.finders = appiumConfig.reactNative.finders;
  }

  get emailInput() { return this.finders.byAccessibilityId('email-input'); }
  get passwordInput() { return this.finders.byAccessibilityId('password-input'); }
  get loginButton() { return this.finders.byText('Sign In'); }
  get signUpTab() { return this.finders.byText('Sign Up'); }
  get nameInput() { return this.finders.byAccessibilityId('name-input'); }
  get registerButton() { return this.finders.byText('Create Account'); }
  get logoutButton() { return this.finders.byText('Sign out'); }

  async login(email, password) {
    if (email) await this.type(this.emailInput, email);
    if (password) await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async register(name, email, password, confirmPassword) {
    await this.click(this.signUpTab);
    if (name) await this.type(this.nameInput, name);
    if (email) await this.type(this.emailInput, email);
    if (password) await this.type(this.passwordInput, password);
    await this.click(this.registerButton);
  }

  async logout() {
    await this.click(this.logoutButton);
  }
}

export default MobileAuthPage;
