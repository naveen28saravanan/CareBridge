import { expect } from 'chai';
import driverManager from '../utilities/driverManager.js';
import AuthPage from '../pages/AuthPage.js';
import PatientWorkspacePage from '../pages/PatientWorkspacePage.js';
import DoctorWorkspacePage from '../pages/DoctorWorkspacePage.js';
import OperationsWorkspacePage from '../pages/OperationsWorkspacePage.js';
import config from '../config/env.config.js';

describe('End-to-End Multi-Role Healthcare Workflow Suite', function () {
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

  it('E2E-001: Execute complete End-to-End patient consultation workflow', async function () {
    // 1. Patient Login & Booking
    await authPage.open();
    await authPage.login(config.users.patient.email, config.users.patient.password, 'patient');
    expect(await patientPage.isWorkspaceDisplayed()).to.be.true;

    await patientPage.bookAppointment('Dr. Ananya Kumar', '10:30 AM');
    await patientPage.runSymptomInsights();
    await patientPage.signOut();

    // 2. Doctor Login & Clinical Documentation
    await authPage.login(config.users.doctor.email, config.users.doctor.password, 'doctor');
    expect(await doctorPage.isWorkspaceDisplayed()).to.be.true;

    await doctorPage.saveClinicalNote(
      'Patient reports high fever and sore throat for 1 day.',
      'Acute pharyngitis, mild URI.',
      'Paracetamol 650mg, salt water gargles, hydration.'
    );
    await doctorPage.createPrescription('Paracetamol', '650 mg', '1 tablet after meals as needed');
    await doctorPage.signOut();

    // 3. Operations Admin Login & Verification Audit
    await authPage.login(config.users.operations.email, config.users.operations.password, 'operations');
    expect(await opsPage.isWorkspaceDisplayed()).to.be.true;

    await opsPage.approveDoctorVerification('Dr. Arjun Mehta');
    await opsPage.updateHospitalAvailability('City General Hospital', 18, 10);
    await opsPage.signOut();

    // Final Assertion: Returned to clean Auth Screen
    expect(await authPage.isAuthScreenDisplayed()).to.be.true;
  });
});
