import { expect } from 'chai';
import driverManager from '../utilities/driverManager.js';
import AuthPage from '../pages/AuthPage.js';
import PatientWorkspacePage from '../pages/PatientWorkspacePage.js';
import DoctorWorkspacePage from '../pages/DoctorWorkspacePage.js';
import OperationsWorkspacePage from '../pages/OperationsWorkspacePage.js';
import discoverRoutesAndForms from '../utilities/routeScanner.js';
import config from '../config/env.config.js';

describe('Dynamic Form Validation & Route Discovery Suite', function () {
  let driver;
  let authPage;
  let patientPage;
  let doctorPage;
  let opsPage;
  let discovery;

  before(async function () {
    driver = await driverManager.getDriver(config.browser, config.headless);
    authPage = new AuthPage(driver);
    patientPage = new PatientWorkspacePage(driver);
    doctorPage = new DoctorWorkspacePage(driver);
    opsPage = new OperationsWorkspacePage(driver);
    
    // Auto-discover React routes, forms, and input rules dynamically
    discovery = discoverRoutesAndForms();
  });

  beforeEach(async function () {
    await authPage.open();
    await authPage.clearSession();
    await authPage.open();
  });

  it('FORM-DYN-001: Validate discovered React routes configuration exists', async function () {
    expect(discovery.routes.roles).to.have.property('patient');
    expect(discovery.routes.roles).to.have.property('doctor');
    expect(discovery.routes.roles).to.have.property('operations');
  });

  it('FORM-DYN-002: Dynamic email input format validation on Signup form', async function () {
    const invalidEmails = discovery.formData.emailValidation.invalid;
    for (const invalidEmail of invalidEmails) {
      await authPage.open();
      await authPage.clearSession();
      await authPage.open();
      await authPage.register('Test User', invalidEmail, 'Password123!', 'Password123!');
      const isAuthVisible = await authPage.isAuthScreenDisplayed();
      expect(isAuthVisible).to.be.true;
    }
  });

  it('FORM-DYN-003: Dynamic password mismatch validation on Signup form', async function () {
    await authPage.selectMode('signup');
    await authPage.register('Test User', 'valid@carebridge.demo', 'Password123!', 'MismatchPassword!');
    const errorMsg = await authPage.getErrorMessage();
    expect(errorMsg).to.include('Passwords do not match');
  });

  it('FORM-DYN-004: Dynamic validation of Patient Symptom Intake form', async function () {
    await authPage.login(config.users.patient.email, config.users.patient.password, 'patient');
    await patientPage.isWorkspaceDisplayed();

    // Run dynamic symptom intake check
    await patientPage.runSymptomInsights();
    
    const isVisible = await patientPage.isWorkspaceDisplayed();
    expect(isVisible).to.be.true;

    await patientPage.signOut();
  });

  it('FORM-DYN-005: Dynamic validation of Doctor Clinical Notes form', async function () {
    await authPage.login(config.users.doctor.email, config.users.doctor.password, 'doctor');
    await doctorPage.isWorkspaceDisplayed();

    const noteData = discovery.formData.clinicalNote;
    await doctorPage.saveClinicalNote(noteData.symptoms, noteData.assessment, noteData.instructions);

    const isVisible = await doctorPage.isWorkspaceDisplayed();
    expect(isVisible).to.be.true;

    await doctorPage.signOut();
  });

  it('FORM-DYN-006: Dynamic validation of Doctor Prescription Builder form', async function () {
    await authPage.login(config.users.doctor.email, config.users.doctor.password, 'doctor');
    await doctorPage.isWorkspaceDisplayed();

    const rxData = discovery.formData.prescription;
    await doctorPage.createPrescription(rxData.medicine, rxData.strength, rxData.instructions);

    const isVisible = await doctorPage.isWorkspaceDisplayed();
    expect(isVisible).to.be.true;

    await doctorPage.signOut();
  });

  it('FORM-DYN-007: Dynamic validation of Operations Hospital ICU form', async function () {
    await authPage.login(config.users.operations.email, config.users.operations.password, 'operations');
    await opsPage.isWorkspaceDisplayed();

    await opsPage.updateHospitalAvailability('City General Hospital', 15, 8);

    const isVisible = await opsPage.isWorkspaceDisplayed();
    expect(isVisible).to.be.true;

    await opsPage.signOut();
  });
});
