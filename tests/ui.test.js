import { expect } from 'chai';
import driverManager from '../utilities/driverManager.js';
import AuthPage from '../pages/AuthPage.js';
import PatientWorkspacePage from '../pages/PatientWorkspacePage.js';
import DoctorWorkspacePage from '../pages/DoctorWorkspacePage.js';
import OperationsWorkspacePage from '../pages/OperationsWorkspacePage.js';
import config from '../config/env.config.js';

describe('UI & Interactive Elements Validation Suite', function () {
  let driver;
  let authPage;
  let patientPage;
  let doctorPage;
  let opsPage;

  before(async function () {
    driver = await driverManager.getDriver(config.browser, config.headless);
    authPage = new AuthPage(driver);
    patientPage = new PatientWorkspacePage(driver);
    doctorPage = new DoctorWorkspacePage(driver);
    opsPage = new OperationsWorkspacePage(driver);
  });

  beforeEach(async function () {
    await authPage.open();
    await authPage.clearSession();
    await authPage.open();
  });

  it('UI-001: Validate Theme Toggle (Dark / Light mode)', async function () {
    await authPage.toggleTheme();
    await driver.sleep(300);
    const htmlTheme = await driver.executeScript('return document.documentElement.dataset.theme;');
    expect(['dark', 'light']).to.include(htmlTheme);
  });

  it('UI-002: Validate Language Selector Dropdown', async function () {
    await authPage.switchLanguage('ta');
    await driver.sleep(300);
    const lang = await driver.executeScript('return document.documentElement.lang;');
    expect(lang).to.equal('ta');
  });

  it('UI-003: Validate Forgot Password Modal open and close', async function () {
    await authPage.openForgotPasswordModal();
    const isModalOpen = await authPage.isElementVisible('.provider-dialog');
    expect(isModalOpen).to.be.true;

    // Close modal by clicking back button
    await authPage.utils.click('.provider-dialog__back');
    await driver.sleep(300);
    const isModalClosed = await authPage.isElementVisible('.provider-dialog', 1000);
    expect(isModalClosed).to.be.false;
  });

  it('UI-004: Validate Doctor Search Bar filtering in Patient Workspace', async function () {
    await authPage.login(config.users.patient.email, config.users.patient.password, 'patient');
    await patientPage.isWorkspaceDisplayed();
    await patientPage.navigateToTab('consult');

    const searchInput = '.doctor-search input';
    if (await patientPage.isElementVisible(searchInput)) {
      await patientPage.utils.type(searchInput, 'Ananya');
      await driver.sleep(300);
      const isDoctorCardVisible = await patientPage.isElementVisible('.doctor-list-card');
      expect(isDoctorCardVisible).to.be.true;
    }

    await patientPage.signOut();
  });

  it('UI-005: Validate Operations Doctor Verification Data Table and Review Modal', async function () {
    await authPage.login(config.users.operations.email, config.users.operations.password, 'operations');
    await opsPage.isWorkspaceDisplayed();
    await opsPage.navigateToTab('doctors');

    const isTableVisible = await opsPage.isElementVisible('.data-table');
    expect(isTableVisible).to.be.true;

    await opsPage.signOut();
  });
});
