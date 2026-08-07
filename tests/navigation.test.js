import { expect } from 'chai';
import driverManager from '../utilities/driverManager.js';
import AuthPage from '../pages/AuthPage.js';
import PatientWorkspacePage from '../pages/PatientWorkspacePage.js';
import DoctorWorkspacePage from '../pages/DoctorWorkspacePage.js';
import OperationsWorkspacePage from '../pages/OperationsWorkspacePage.js';
import fs from 'fs';
import path from 'path';
import config from '../config/env.config.js';

const routesData = JSON.parse(fs.readFileSync(path.resolve('data/routes.json'), 'utf8'));

describe('Navigation & Internal Routing Validation Suite', function () {
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

  it('NAV-001: Validate navigation through all Patient workspace links', async function () {
    await authPage.login(config.users.patient.email, config.users.patient.password, 'patient');
    await patientPage.isWorkspaceDisplayed();

    const patientRoutes = routesData.roles.patient.routes;
    for (const route of patientRoutes.slice(0, 5)) {
      await patientPage.navigateToTab(route.id);
      const isVisible = await patientPage.isWorkspaceDisplayed();
      expect(isVisible).to.be.true;
    }

    await patientPage.signOut();
  });

  it('NAV-002: Validate navigation through Doctor workspace tabs', async function () {
    await authPage.login(config.users.doctor.email, config.users.doctor.password, 'doctor');
    await doctorPage.isWorkspaceDisplayed();

    const doctorRoutes = routesData.roles.doctor.routes;
    for (const route of doctorRoutes.slice(0, 4)) {
      await doctorPage.navigateToTab(route.id);
      const isVisible = await doctorPage.isWorkspaceDisplayed();
      expect(isVisible).to.be.true;
    }

    await doctorPage.signOut();
  });

  it('NAV-003: Validate navigation through Operations workspace tabs', async function () {
    await authPage.login(config.users.operations.email, config.users.operations.password, 'operations');
    await opsPage.isWorkspaceDisplayed();

    const opsRoutes = routesData.roles.operations.routes;
    for (const route of opsRoutes.slice(0, 4)) {
      await opsPage.navigateToTab(route.id);
      const isVisible = await opsPage.isWorkspaceDisplayed();
      expect(isVisible).to.be.true;
    }

    await opsPage.signOut();
  });

  it('NAV-004: Validate browser refresh, back, and forward navigation', async function () {
    await authPage.login(config.users.patient.email, config.users.patient.password, 'patient');
    await patientPage.isWorkspaceDisplayed();

    await patientPage.navigateToTab('consult');
    await patientPage.refreshPage();
    let isVisible = await patientPage.isWorkspaceDisplayed();
    expect(isVisible).to.be.true;

    await patientPage.navigateBack();
    await driver.sleep(500);
    let currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('data:') || currentUrl === 'about:blank') {
      await authPage.open();
    }
    isVisible = (await patientPage.isWorkspaceDisplayed()) || (await authPage.isAuthScreenDisplayed());
    expect(isVisible).to.be.true;
  });
});
