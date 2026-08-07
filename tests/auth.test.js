import { expect } from 'chai';
import driverManager from '../utilities/driverManager.js';
import AuthPage from '../pages/AuthPage.js';
import PatientWorkspacePage from '../pages/PatientWorkspacePage.js';
import fs from 'fs';
import path from 'path';
import config from '../config/env.config.js';

const authData = JSON.parse(fs.readFileSync(path.resolve('data/authData.json'), 'utf8'));

describe('Authentication & Session Management Suite', function () {
  let driver;
  let authPage;
  let patientPage;

  before(async function () {
    driver = await driverManager.getDriver(config.browser, config.headless);
    authPage = new AuthPage(driver);
    patientPage = new PatientWorkspacePage(driver);
  });

  beforeEach(async function () {
    await authPage.open();
    await authPage.clearSession();
    await authPage.open();
  });

  it('AUTH-001: Validate login with empty email field', async function () {
    await authPage.login('', 'Password123!', 'patient');
    const isAuthStillVisible = await authPage.isAuthScreenDisplayed();
    expect(isAuthStillVisible).to.be.true;
  });

  it('AUTH-002: Validate login with empty password field', async function () {
    await authPage.login('patient@carebridge.demo', '', 'patient');
    const isAuthStillVisible = await authPage.isAuthScreenDisplayed();
    expect(isAuthStillVisible).to.be.true;
  });

  it('AUTH-003: Validate login with invalid credentials', async function () {
    await authPage.login('patient@carebridge.demo', 'WrongPassword123', 'patient');
    const isAuthStillVisible = await authPage.isAuthScreenDisplayed();
    expect(isAuthStillVisible).to.be.true;
  });

  it('AUTH-004: Validate successful Patient authentication flow', async function () {
    const patientUser = authData.validUsers.patient;
    await authPage.login(patientUser.email, patientUser.password, 'patient');
    const isWorkspaceVisible = await patientPage.isWorkspaceDisplayed();
    expect(isWorkspaceVisible).to.be.true;
  });

  it('AUTH-005: Validate Patient logout flow', async function () {
    const patientUser = authData.validUsers.patient;
    await authPage.login(patientUser.email, patientUser.password, 'patient');
    await patientPage.isWorkspaceDisplayed();
    await patientPage.signOut();
    const isAuthVisible = await authPage.isAuthScreenDisplayed();
    expect(isAuthVisible).to.be.true;
  });

  it('AUTH-006: Validate session persistence on page refresh', async function () {
    const patientUser = authData.validUsers.patient;
    await authPage.login(patientUser.email, patientUser.password, 'patient');
    await patientPage.isWorkspaceDisplayed();
    
    await patientPage.refreshPage();
    await driver.sleep(1000);
    const isWorkspaceStillVisible = await patientPage.isWorkspaceDisplayed();
    expect(isWorkspaceStillVisible).to.be.true;

    // Clean up session
    await patientPage.signOut();
  });
});
